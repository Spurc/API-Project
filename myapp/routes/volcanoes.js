var express = require('express');
var router = express.Router();

//Gets volcanoes data.
router.get("/", function(req,res, next) {
  const country = req.query.country;
  const populatedWithin = req.query.populatedWithin;
  const query = req.query;

  //Check if country query exist.
  if(!country){
    res.status(400).json({
      "error": true,
      "message": "Country is a required parameter."
    })
    return;
  }

  //Ensure that populatedWithin is only the below options.
  const popOptions = ["5km", "10km", "30km", "100km"]
  if(populatedWithin){
    if(!popOptions.includes(populatedWithin)){
      res.status(400).json({
        "error": true,
        "message": "Invalid value for populatedWithin. Only: 5km,10km,30km,100km are permitted."
      })
      return;
    }  
  }
  
  //If just country exist show everything. 
  if(country && !populatedWithin){
    req.db.from('data')
    .select("id", "name", "country", "region", "subregion")
    .where('country', '=', country)
    .then((rows) => {
      res.status(200).json(rows)
      return;
    })
    .catch((err) => {
      console.log(err);
      res.json({"Error" : true, "Message" : "Error in MySQL query"})
    })
  }
  //If both country and population exit display populatedWithin specifc data
  else{
    req.db.from('data')
    .select("id", "name", "country", "region", "subregion")
    .where('country', '=', country).andWhere(`population_${populatedWithin}` ,'>','0')
    .then((rows) => {
      if(rows)

      res.status(200).json(rows)
      return;
    })
    .catch((err) => {
    console.log(err);
    res.json({"Error" : true, "Message" : "Error in MySQL query"})
    })
  }
});

module.exports = router;