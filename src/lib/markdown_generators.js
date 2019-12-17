#!/usr/bin/env node

const yaml = require("js-yaml")
const markdown = require("markdown-builder")
const titleCase = require("title-case")
const TurndownService = require("turndown")
const tables = require("turndown-plugin-gfm").tables
const turndownService = new TurndownService()
turndownService.use(tables)
const helpers = require("./helpers")

class MarkdownGenerators {
  static generateCourseHomeFrontMatter(courseData) {
    /*
        Generate the front matter metadata for the course home page given course_data JSON
        */
    const frontMatter = {}
    frontMatter["title"] = "Course Home"
    frontMatter["course_title"] = courseData["title"]
    frontMatter["course_image_url"] = helpers.getCourseImageUrl(courseData)
    frontMatter["course_description"] = courseData["description"]
    frontMatter["course_info"] = {}
    frontMatter["course_info"]["instructors"] = []
    courseData["instructors"].forEach(instructor => {
      frontMatter["course_info"]["instructors"].push(
        `Prof. ${instructor["first_name"]} ${instructor["last_name"]}`
      )
    })
    frontMatter["course_info"]["department"] = titleCase.titleCase(
      courseData["url"].split("/")[2].replace(/-/g, " ")
    )
    frontMatter["course_info"]["topics"] = []
    courseData["course_collections"].forEach(feature => {
      let topic = ""
      if (feature["ocw_feature"]) {
        topic += feature["ocw_feature"]
      }
      if (feature["ocw_subfeature"]) {
        topic += ` - ${feature["ocw_subfeature"]}`
      }
      frontMatter["course_info"]["topics"].push(topic)
    })
    let courseNumber = courseData["sort_as"]
    if (courseData["extra_course_number"]) {
      if (courseData["extra_course_number"]["sort_as_col"]) {
        courseNumber += ` / ${courseData["extra_course_number"]["sort_as_col"]}`
      }
    }
    frontMatter["course_info"]["course_number"] = courseNumber
    frontMatter["course_info"][
      "term"
    ] = `${courseData["from_semester"]} ${courseData["from_year"]}`
    frontMatter["course_info"]["level"] = courseData["course_level"]
    frontMatter["menu"] = {}
    frontMatter["menu"]["main"] = {}
    frontMatter["menu"]["main"]["weight"] = -10
    return `---\n${yaml.safeDump(frontMatter)}---\n`
  }

  static generateCourseSectionFrontMatter(title, menuIndex) {
    /*
        Generate the front matter metadata for a course section given a title and menu index
        */
    const frontMatter = {}
    frontMatter["title"] = title
    frontMatter["menu"] = {}
    frontMatter["menu"]["main"] = {}
    frontMatter["menu"]["main"]["weight"] = menuIndex
    return `---\n${yaml.safeDump(frontMatter)}---\n`
  }

  static generateCourseFeatures(courseData) {
    /*
        Generate markdown for the "Course Features" section of the home page
        */
    let courseFeaturesMarkdown = markdown.headers.hX(5, "Course Features")
    const courseFeatures = []
    courseData["course_features"].forEach(courseFeature => {
      const url = courseFeature["ocw_feature_url"]
        .replace("/index.htm", "/")
        .split("/")[-1]
      courseFeatures.push(markdown.misc.link(courseFeature["ocw_feature"], url))
    })
    courseFeaturesMarkdown += `\n${markdown.lists.ul(courseFeatures)}`
    return courseFeaturesMarkdown
  }

  static generateCourseCollections(courseData) {
    /*
        Generate markdown for the "Course Collections" section of the home page
        */
    let courseCollectionsMarkdown = markdown.headers.hX(5, "Course Collections")
    courseCollectionsMarkdown +=
      "\nSee related courses in the following collections:\n"
    courseCollectionsMarkdown += `\n${markdown.emphasis.i(
      "Find Courses by Topic"
    )}\n\n`
    const courseCollections = []
    courseData["course_collections"].forEach(courseCollection => {
      const feature = courseCollection["ocw_feature"]
      const subfeature = courseCollection["ocw_subfeature"]
      const specialty = courseCollection["ocw_specialty"]
      let collection = feature
      if (subfeature) {
        collection += ` > ${subfeature}`
      }
      if (specialty) {
        collection += ` > ${specialty}`
      }
      courseCollections.push(markdown.misc.link(collection, "#"))
    })
    courseCollectionsMarkdown += markdown.lists.ul(courseCollections)
    return courseCollectionsMarkdown
  }

  static generateCourseSectionMarkdown(page, courseData) {
    /*
        Generate markdown a given course section page
        */
    let htmlStr = page["text"]
    courseData["course_pages"].forEach(coursePage => {
      const placeholder = `./resolveuid/${coursePage["uid"]}`
      const pageName = coursePage["short_url"].replace(".html", "")
      if (htmlStr.indexOf(placeholder) > -1) {
        htmlStr = htmlStr.replace(placeholder, `/sections/${pageName}`)
      }
    })
    courseData["course_files"].forEach(media => {
      const placeholder = `./resolveuid/${media["uid"]}`
      if (htmlStr.indexOf(placeholder) > -1) {
        // TODO: Add option to change links to media to be at root of site for static copy
      }
    })
    try {
      return turndownService.turndown(htmlStr)
    } catch (err) {
      return htmlStr
    }
  }
}

module.exports = MarkdownGenerators
