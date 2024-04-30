var express = require('express');
var router = express.Router();

//Get all the countries names in ascending order.
router.get("/", function(req,res, next) {

  //Checks that no req.query's are present. 
  if(req.url !== "/"){
    res.status(400).json({
      "error": true,
      "message": "Invalid query parameters. Query parameters are not permitted."
    })
    return;
  }

  //Provide list of countires as an array.
  req.db.distinct().from('data').orderBy('country', 'asc').pluck('country')
  .then((rows) =>  {
    res.status(200).json(rows)
    return;
  })
  .catch((err) => {
    console.log(err);
    res.json({"Error" : true, "Message" : "Error within server"})
  })
});

module.exports = router;