var express = require('express');
const {authorize} = require('./authVolcano');
var router = express.Router();

//Gets individual volcano data and provides extra data if a user is authenticated.
router.get('/:id', authorize, function(req, res, next) {
  const id = req.params.id;

  //If id does not exist in in db ()
  //Largest id found using SELECT COUNT("id") FROM data in workbench.
  if(id > 1343){
    res.status(404).json({
      "error": true,
      "message": `Volcano with ID: ${id} not found.` 
    })
    return;
  }

  //Check if query params exist.
  if(req._parsedUrl.query !== null){
    res.status(400).json({
      "error": true,
      "message": "Invalid query parameters. Query parameters are not permitted."
    })
    return;
  }

  //If authorization doesn't exist show base volcano information.
  const noAuth = req.headers.authorization
  if(!noAuth){
    req.db.from('data').select("id", "name", "country", "region", "subregion", "last_eruption", "summit", "elevation", "latitude", "longitude")
    .where("id", "=", id)
    .then((rows) => {
      res.status(200).json(rows[0])
    })
    .catch((err) => {
      res.status(500).json({
        "error" : true, 
        "message" : "Error within server"})
      return;
    })
  }
});

module.exports = router;