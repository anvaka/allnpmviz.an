module.exports = function (collection, foundCb, itemsPerPage) {
  collection = collection || [];
  itemsPerPage = itemsPerPage || 20;
  lastPage = 0;

  return {
    loadMore : function () {
      var totalItems = collection.length;
      if (totalItems === 0) return;

      var from = itemsPerPage * lastPage;
      var to = Math.min((lastPage + 1) * itemsPerPage, totalItems);
      if (to - from <= 0) return;

      foundCb(collection.slice(from, to));
      lastPage += 1;
    }
  };
};
