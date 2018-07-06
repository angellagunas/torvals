#!/usr/bin/env groovy

pipeline {
  agent any

  options {
    ansiColor("xterm")
  }

  stages {
    stage("Startup") {
      steps {
        script { load "${env.JENKINS_HOME}/.envvars/orax/common/env.groovy" }
        // TODO: Start test environment
        // TODO: Install dependencies
      }
    }
    stage("Test") {
      when { anyOf { branch "dev" } }
      steps {
        sh "cp .env.ci .env"
        sh "make post-ci"
        sh "make ci"
      }
      post {
        always {
          sh "make post-ci"
        }
      }
    }
    stage("Build") {
      when { anyOf { branch "master"; branch "release" } }
      steps {
        script { load "${env.JENKINS_HOME}/.envvars/orax/${env.BRANCH_NAME}/env.groovy" }
        sh "make build"
      }
      post {
        failure {
          slackSend(
            channel: env.SLACK_CHANNEL,
            color: "danger",
            message: "Build failed\n${env.BUILD_URL}"
          )
        }
      }
    }
    stage("Publish") {
      when { anyOf { branch "master"; branch "release" } }
      steps {
        withAWS(region: env.AWS_REGION, credentials: env.AWS_CREDENTIALS) {
          script {
            String login = ecrLogin()
            sh login
          }
        }
        sh "make publish"
      }
      post {
        failure {
          slackSend(
            channel: env.SLACK_CHANNEL,
            color: "danger",
            message: "Publish failed\n${env.BUILD_URL}"
          )
        }
      }
    }
    stage("Deploy") {
      when { anyOf { branch "master"; branch "release" } }
      steps {
        sh "tar -czf docker.tar.gz -C ~ .docker"
        withAWS(region: env.AWS_REGION, credentials: env.AWS_CREDENTIALS) {
          s3Upload(bucket: env.AWS_BUCKET, file: "docker.tar.gz", path: "docker.tar.gz")
        }
        script {
          env.URIS = "\"https://${env.AWS_BUCKET}.s3.amazonaws.com/docker.tar.gz\""
        }
        sh "make update_settings"
        marathon(
          url: env.MARATHON_URL,
          id: "/orax/${env.BRANCH_NAME}/kore",
          forceUpdate: true,
          credentialsId: env.MARATHON_CREDENTIALS
        )
      }
      post {
        always {
          sh "rm docker.tar.gz marathon*.json"
        }
        failure {
          slackSend(
            channel: env.SLACK_CHANNEL,
            color: "danger",
            message: "Deploy failed\n${env.BUILD_URL}"
          )
        }
        success {
          slackSend(
            channel: env.SLACK_CHANNEL,
            color: "good",
            message: "Successfully deployed ${env.BRANCH_NAME} api"
          )
        }
      }
    }
  }
}
