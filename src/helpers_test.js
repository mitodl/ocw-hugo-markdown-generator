const path = require("path")
const { assert } = require("chai")
const helpers = require("./helpers")
const fs = require("fs")
const tmp = require("tmp")
tmp.setGracefulCleanup()

const singleCourseSourcePath =
  "test_data/2-00aj-exploring-sea-space-earth-fundamentals-of-engineering-design-spring-2009"
const singleCourseMasterJsonPath = path.join(
  singleCourseSourcePath,
  "e395587c58555f1fe564e8afd75899e6_master.json"
)
const singleCourseRawData = fs.readFileSync(singleCourseMasterJsonPath)
const singleCourseJsonData = JSON.parse(singleCourseRawData)

describe("getCourseImageUrl", () => {
  it("returns the expected course image file name for a given course json input", () => {
    assert.equal(
      helpers.getCourseImageUrl(singleCourseJsonData),
      "https://open-learning-course-data.s3.amazonaws.com/2-00aj-exploring-sea-space-earth-fundamentals-of-engineering-design-spring-2009/b6a31a6a85998d664ea826a766d9032b_2-00ajs09.jpg"
    )
  })
})

describe("findDepartmentByNumber", () => {
  it("returns the expected department for a given department number integer", () => {
    assert.equal(helpers.findDepartmentByNumber(18)["title"], "Mathematics")
  })

  it("returns the expected department for a given department number string", () => {
    assert.equal(helpers.findDepartmentByNumber("18")["title"], "Mathematics")
  })
})

describe("getDepartments", () => {
  it("returns the expected departments for a given course json input", () => {
    assert.equal(
      helpers.getDepartments(singleCourseJsonData)[0],
      "Mechanical Engineering"
    )
    assert.equal(
      helpers.getDepartments(singleCourseJsonData)[1],
      "Aeronautics and Astronautics"
    )
  })
})

describe("getCourseNumbers", () => {
  it("returns the expected course numbers for a given course json input", () => {
    assert.equal(helpers.getCourseNumbers(singleCourseJsonData)[0], "2.00 A")
    assert.equal(helpers.getCourseNumbers(singleCourseJsonData)[1], "16.00AJ")
  })
})

describe("getCourseFeatureObject", () => {
  it("returns the expected object from a course feature object", () => {
    const featureObject = helpers.getCourseFeatureObject(
      singleCourseJsonData["course_features"][2]
    )
    assert.equal(featureObject["feature"], "Assignments")
    assert.equal(featureObject["subfeature"], "design with examples")
  })
})

describe("getCourseSectionFromFeatureUrl", () => {
  it("returns the expected course section from a course feature object", () => {
    assert.equal(
      helpers.getCourseSectionFromFeatureUrl(
        singleCourseJsonData["course_features"][2]
      ),
      "./resolveuid/293500564c0073c5971dfc2bbf334afc"
    )
  })
})

describe("getCourseCollectionObject", () => {
  it("returns a course collection object with the expected keys", () => {
    const collection = helpers.getCourseCollectionObject(
      singleCourseJsonData["course_collections"][0]
    )
    assert.equal(collection["topic"], "Engineering")
    assert.equal(collection["subtopic"], "Systems Engineering")
    assert.equal(collection["speciality"], "Systems Design")
  })
})

describe("getCourseCollectionText", () => {
  it("returns the expected course collection text from a course collection object and a separator", () => {
    assert.equal(
      helpers.getCourseCollectionText(
        singleCourseJsonData["course_collections"][0],
        ">"
      ),
      "Engineering > Systems Engineering > Systems Design"
    )
  })
})

describe("getYoutubeEmbedHtml", () => {
  it("returned html strings contain the youtube media url for each embedded media", () => {
    let html = ""
    Object.keys(singleCourseJsonData["course_embedded_media"]).forEach(key => {
      html = `${html}${helpers.getYoutubeEmbedHtml(
        singleCourseJsonData["course_embedded_media"][key]
      )}`
    })
    Object.keys(singleCourseJsonData["course_embedded_media"]).forEach(key => {
      const youTubeMedia = singleCourseJsonData["course_embedded_media"][
        key
      ].filter(embeddedMedia => {
        return embeddedMedia["id"] === "Video-YouTube-Stream"
      })
      youTubeMedia.forEach(embeddedMedia => {
        assert(html.includes(embeddedMedia["media_info"]))
      })
    })
  })
})

describe("pathToChildRecursive", () => {
  it("returns the expected path to a child section", () => {
    const expectedChild = singleCourseJsonData["course_pages"].filter(
      page => page["uid"] === "0aee0583c6aac4a87ddefb73319a8f26"
    )[0]
    assert.equal(
      helpers.pathToChildRecursive(
        "sections/",
        expectedChild,
        singleCourseJsonData
      ),
      "sections/labs/river-testing-photos"
    )
  })
})
