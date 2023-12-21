class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const key = this.queryStr.key;
    const keyword = this.queryStr.keyword;

    switch (key) {
      case "name":
        this.query = this.query.find({
          name: {
            $regex: keyword,
            $options: "i",
          },
        });
        break;
      case "email":
        this.query = this.query.find({
          email: {
            $regex: keyword,
            $options: "i",
          },
        });
        break;
      case "mobile":
        this.query = this.query.find({ mobile: keyword });
        break;
    }
    return this;
  }

  //pagination
  pagination(resultPerPage) {
    const pageNumber = Number(this.queryStr.pageNumber) + 1;
    let skipValue = resultPerPage * (pageNumber - 1);
    this.query = this.query.limit(resultPerPage).skip(skipValue);
    return this;
  }
}

module.exports = ApiFeatures;