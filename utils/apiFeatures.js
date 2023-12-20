class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });

    return this;
  }

  //pagination
  pagination(resultPerPage) {
    const pageNumber = Number(this.queryStr.pageNumber) + 1;
    let skipValue = resultPerPage * (pageNumber - 1);
    this.query = this.query.limit(resultPerPage).skip(skipValue);
    return this;
  }

  //filter
  filter() {
    const queryCopy = { ...this.queryStr };
    

    return this;
  }

}

module.exports = ApiFeatures;
