class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {}

  //pagination
  pagination(resultPerPage) {
    const pageNumber = this.queryStr;
    let skipValue = resultPerPage * (pageNumber - 1);
    this.query = this.query.limit(resultPerPage).skip(skipValue);
    return this;
  }
}

module.exports = ApiFeatures;
