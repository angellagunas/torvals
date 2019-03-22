pipeline {
    agent any
    stages {
        stage('build') {
            when { anyOf { branch "stage"; branch "release"} }
            parallel {
                stage('build back'){
                    steps{
                        script{
                            if(env.BRANCH_NAME == 'stage'){
                                env.BACKEND_NAME = "bec-back:1.0.${BUILD_NUMBER}-dev"
                                sh("echo 'build backend stage: ${env.BACKEND_NAME}'")
                            }
                            else if(env.BRANCH_NAME == 'release'){
                                env.BACKEND_NAME = "bec-back:1.0.${BUILD_NUMBER}-prod"
                                sh("echo 'build backend production: ${env.BACKEND_NAME}'")
                            }
                            
                            backend_image = docker.build("${GLOBAL_REGISTRY}/${env.BACKEND_NAME}", "--no-cache ./backend")
                        }
                    }
                }
                stage('build front') {
                    steps{
                        script{
                            if(env.BRANCH_NAME == 'stage'){
                                env.FRONTEND_NAME = "bec-front:1.0.${BUILD_NUMBER}-dev"
                                sh("echo 'build frontend stage: ${env.FRONTEND_NAME}'")
                            }
                            else if(env.BRANCH_NAME == 'release'){
                                env.FRONTEND_NAME = "bec-front:1.0.${BUILD_NUMBER}-prod"
                                sh("echo 'build frontend production: ${env.FRONTEND_NAME}'")
                            }

                            frontend_image = docker.build("${GLOBAL_REGISTRY}/${env.FRONTEND_NAME}", "--no-cache ./frontend")
                        }
                    }
                }
            }
        }
        stage('upload fronted and backend') {
            when { anyOf { branch 'stage'; branch 'release' } }
            parallel{
                stage('upload back'){
                    steps{
                        script{
                            docker.withRegistry("https://${GLOBAL_REGISTRY}", "ecr:us-east-1:ECR") {
                                backend_image.push()
                            }

                            sh("docker rmi ${backend_image.id}")
                        }

                    }
                }
                stage('upload front'){
                    steps{
                        script{
                            docker.withRegistry("https://${GLOBAL_REGISTRY}", "ecr:us-east-1:ECR") {
                                frontend_image.push()
                            }

                            sh("docker rmi ${frontend_image.id}")
                        }
                    }
                }
            }
        }
    }
    post {
        always{
            script{
                if (env.BRANCH_NAME == 'stage' || env.BRANCH_NAME == 'release'){
                    GIT_AUTHOR = sh (
                        script: 'git log -1 --pretty=format:%an',
                        returnStdout: true
                    ).trim()
                    GIT_MESSAGE = sh (
                        script: 'git log -1 --pretty=format:%s',
                        returnStdout: true
                    ).trim()

                    slackSend (
                        channel: 'int-dev-cicd',
                        message: "${currentBuild.fullProjectName}: ${currentBuild.currentResult}\nGit Author: ${GIT_AUTHOR}\nGit Subject: ${GIT_MESSAGE}\nBack: ${env.BACKEND_NAME}\nFront: ${env.FRONTEND_NAME}\nDuration: ${currentBuild.durationString}"
                    )
                }
            }
        }
    }
}