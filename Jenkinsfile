// 프로파일마다 다른 것 중 비밀이 아닌 것은 여기에, 비밀은 Jenkins Credentials 에 둔다.
//   envFile     → Secret file credential. API_BASE_URL · TRUSTED_PROXY_HOPS 등 값 파일 전체를 올려 두고, 배포 때
//                 APP_DIR 에 놓아 컨테이너의 /app/.env.production 으로 마운트한다. 이미지에는 들어가지 않는다.
//                 next start 는 두 프로파일 모두 NODE_ENV=production 이라 컨테이너 안 경로는 같다.
//   port        → 이 서버에서 열 포트. dev · prod 가 한 서버에 같이 뜨므로 겹치면 안 된다(api 는 8001 · 8000).
// 배포 방식: Jenkins 가 설치된 서버에서 이미지를 빌드하고 그 자리에서 컨테이너를 띄운다(레지스트리 · SSH 없음).
def PROFILES = [
  dev : [envFile: 'whale-erp-staff-env-dev',  port: '4001'],
  prod: [envFile: 'whale-erp-staff-env-prod', port: '4000'],
]

pipeline {
  agent any // Jenkins 서버 자신. jenkins 사용자가 docker 를 쓸 수 있어야 한다(docker 그룹). node · pnpm 은 필요 없다(이미지 안에서 빌드한다).

  parameters {
    choice(name: 'PROFILE', choices: ['dev', 'prod'], description: '배포 프로파일')
  }

  environment {
    IMAGE   = 'whale-erp-staff'
    APP_DIR = '/opt/whale-erp-staff'
  }

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          def cfg = PROFILES[params.PROFILE]
          // 잡에 파라미터가 아직 등록되지 않은 첫 실행은 params 에 기본값만 들어오고 sh 의 $PROFILE 은 비므로 직접 넣는다.
          env.PROFILE = params.PROFILE
          env.ENV_FILE_CRED = cfg.envFile
          env.HOST_PORT = cfg.port
          env.TAG = "${params.PROFILE}-${env.GIT_COMMIT.take(8)}-${env.BUILD_NUMBER}"
          currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.TAG}"
        }
      }
    }

    stage('Build') {
      steps {
        sh 'docker build -t $IMAGE:$TAG -t $IMAGE:$PROFILE-latest .'
      }
    }

    stage('Approve') {
      when { expression { params.PROFILE == 'prod' } }
      steps {
        input message: "운영에 ${env.TAG} 를 배포할까요?", ok: '배포'
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([file(credentialsId: env.ENV_FILE_CRED, variable: 'ENV_FILE')]) {
          // 디렉터리는 700 으로 서버의 다른 사용자를 막고, 파일은 644 로 둔다 — 컨테이너의 node 사용자(uid 1000)가
          // 마운트된 파일을 읽어야 하기 때문이다.
          // 마운트하는 이유: docker run --env-file 은 따옴표를 벗기지 않아, dotenv 로 읽던 따옴표 값이 다르게 들어간다.
          sh '''
            mkdir -p $APP_DIR && chmod 700 $APP_DIR
            install -m 644 "$ENV_FILE" $APP_DIR/.env.$PROFILE

            (docker rm -f whale-erp-staff-$PROFILE || true)
            docker run -d --name whale-erp-staff-$PROFILE --restart unless-stopped \
              -p $HOST_PORT:3000 \
              -v $APP_DIR/.env.$PROFILE:/app/.env.production:ro \
              $IMAGE:$TAG

            # 필수 env(API_BASE_URL · TRUSTED_PROXY_HOPS)가 잘못되면 next 는 프로세스를 띄운 채 모든 요청에 500 을 내므로,
            # 로그인 화면이 실제로 열리는지까지 확인한다.
            # Jenkins 가 컨테이너 안에서 돌아 localhost 는 Jenkins 자신이다 — 호스트에 뜬 앱은 host.docker.internal 로 본다.
            for i in $(seq 1 30); do
              curl -sf host.docker.internal:$HOST_PORT/login >/dev/null && exit 0
              sleep 2
            done
            docker logs --tail 50 whale-erp-staff-$PROFILE
            exit 1
          '''
        }
      }
    }
  }

  post {
    always { sh 'docker image prune -f || true' }
  }
}
