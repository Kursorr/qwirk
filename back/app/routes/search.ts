import * as express from 'express'

import { elasticSearchHelper } from '../../scripts/class/ElasticSearchHelper'

const search = express.Router()

search.get('/', async (req, res) => {
  const search = new elasticSearchHelper()
  const result = await search.getData(req.query.term, req.query.offset)
  // console.log(req.query)
  res.status(200).json({
    result
  })
})

export default search
