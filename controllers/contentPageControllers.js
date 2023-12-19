const ContentPage = require("../models/contentPageModel");
const ApiFeatures = require("../utils/apiFeatures");

exports.getAllContent = async (req, res) => {
  try {
    const contentCount = await ContentPage.countDocuments();
    const resultPerPage = req.query.resultPerPage || 10;
    const apiFeatures = new ApiFeatures(ContentPage.find(), req.query)
      .pagination(resultPerPage)
      .search();

    const contentData = await apiFeatures.query;

    if (!contentData)
      return res.status(404).json({
        success: false,
        message: " No Content Found!",
      });


    return res.status(200).json({
      success: true,
      contentCount,
      contentData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "No Content Found!",
    });
  }
};

exports.getSingleContent = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  try {
    const contentData = await ContentPage.findById({ _id: id });
    if (!contentData) {
      return res.status(404).json({
        success: false,
        message: "No Content Found!",
      });
    }

    return res.status(200).json({
      success: true,
      contentData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateContents = async (req, res) => {
  const { id } = req.query;
  const { content } = req.body;
  try {
    if (!content && content === null) {
      return res.status(400).json({
        success: false,
        message: "New Content Required!",
      });
    }

    const oldData = await ContentPage.findById({ _id: id });
    
    oldData.content = content;
    const result = await oldData.save();

    if (!result)
      return res.status(401).json({
        message: "Something Went Wrong!",
      });

    return res.status(200).json({
      success: true,
      message: "Content Updated Successfully!",
      result
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
