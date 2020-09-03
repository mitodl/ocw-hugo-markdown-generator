/* eslint-disable no-console */

const fs = require("fs")
const path = require("path")
const AWS = require("aws-sdk")
require("dotenv").config()
const cliProgress = require("cli-progress")

const { createOrOverwriteFile } = require("./helpers")

const progressBar = new cliProgress.SingleBar(
  { stopOnComplete: true },
  cliProgress.Presets.shades_classic
)

const downloadCourses = async (coursesJson, coursesDir) => {
  if (!fs.existsSync(coursesJson)) {
    throw new Error("Invalid courses JSON")
  }
  if (!coursesDir) {
    throw new Error("Invalid courses directory")
  }
  if (!process.env["AWS_BUCKET_NAME"]) {
    throw new Error("AWS_BUCKET_NAME not set")
  }
  /**
   * We explicitly configure credentials here if we see them set because
   * the aws-sdk will not automatically configure itself from values set in
   * .env files
   */
  if (
    process.env["AWS_REGION"] ||
    process.env["AWS_ACCESS_KEY"] ||
    process.env["AWS_SECRET_ACCESS_KEY"]
  ) {
    const config = {}
    if (process.env["AWS_REGION"]) {
      config["region"] = process.env["AWS_REGION"]
    }
    if (process.env["AWS_ACCESS_KEY"] && process.env["AWS_SECRET_ACCESS_KEY"]) {
      config["credentials"] = new AWS.Credentials({
        accessKeyId:     process.env["AWS_ACCESS_KEY"],
        secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]
      })
    } else {
      throw new Error("AWS credentials not set")
    }
    AWS.config = new AWS.Config(config)
  }

  const s3 = new AWS.S3()
  const courses = JSON.parse(fs.readFileSync(coursesJson))["courses"]
  const totalCourses = courses.length
  console.log(`Downloading ${totalCourses} courses from AWS...`)
  progressBar.start(totalCourses, 0)
  return await Promise.all(
    courses.map(async course => {
      const bucketParams = {
        Bucket: process.env["AWS_BUCKET_NAME"],
        Prefix: course
      }
      await downloadCourseRecursive(s3, bucketParams, coursesDir)
      progressBar.increment()
    })
  )
}

const downloadCourseRecursive = async (s3, bucketParams, destination) => {
  const listData = await s3.listObjectsV2(bucketParams).promise()
  const newFiles = []
  let modifiedFiles = await Promise.all(
    listData.Contents.map(async content => {
      const filePath = path.join(destination, content.Key)
      const getObjectParams = {
        Bucket: bucketParams.Bucket,
        Key:    content.Key
      }
      if (fs.existsSync(filePath)) {
        const mtime = fs.statSync(filePath).mtime
        if (content.LastModified > mtime) {
          return await s3.getObject(getObjectParams).promise()
        }
      } else {
        newFiles.push(await s3.getObject(getObjectParams).promise())
      }
      return null
    })
  )
  modifiedFiles = modifiedFiles.filter(file => file)

  const writeS3Object = file => {
    const key = listData.Contents.find(content => content.ETag === file.ETag)
      .Key
    createOrOverwriteFile(path.join(destination, key), file.Body)
  }

  modifiedFiles.forEach(writeS3Object)
  newFiles.forEach(writeS3Object)

  if (listData.IsTruncated) {
    bucketParams.ContinuationToken = listData.NextContinuationToken
    await downloadCourseRecursive(s3, bucketParams, destination)
  }
}

module.exports = {
  downloadCourses,
  downloadCourseRecursive
}
