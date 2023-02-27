const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');


app.use(express.json());

/**
 * @swagger
 * components:
 *     schemas:
 *         Company:
 *             type: object
 *             properties:
 *                  companyId:
 *                       type: string
 *                       required: true
 *                  companyName:
 *                       type: string
 *                  companyCity:
 *                       type: string
 *         CompanyPut:
 *             type: object
 *             properties:
 *                  companyName:
 *                       type: string
 *                  companyCity:
 *                       type: string
 *         CompanyPatch:
 *            type: object
 *            properties:
 *                  companyName:
 *                       type: string
 *                  
 */

 const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    components: {},
    info: {
      title: 'ENTER YOUR TITLE HERE',
      version: '1.0.0',
      description: 'WRITE YOUR DESCRIPTION'
    },
    host: '161.35.52.16:3000',
    basePath: '/',
  },
  apis: ['./server.js']
};

const specs = swaggerJsDoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors({
  origin: '*'
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: 3306,
  connectionLimit: 5,
  database: 'sample',

});

app.get('/', (req, res) => {
  res.send('Welcome!');
});

/*Validation and Sanitization */

const validateCompany = [
  body('companyId')
    .exists()
    .withMessage('CompanyId is required and cannot be empty')
    .notEmpty().trim().escape(), body('companyId').exists().withMessage('companyId is missing').trim().escape(), body('companyName').exists().withMessage('companyName is missing').trim().escape(), body('companyCity').exists().withMessage('companyCity is missing').trim().escape()];

const validateCompanyPatch = [
  body('companyName')
    .exists()
    .withMessage('companyName is missing').trim().escape()];

const validateCompanyPut = [body('companyName').exists().withMessage('companyName is missing').trim().escape(), body('companyCity').exists().withMessage('companyCity is missing').trim().escape()];

const validateCompanyIdParam = [param('id').exists().withMessage('Company Id is required and cannot be empty').notEmpty().trim().escape()];

/**
 * @swagger
 * /company:
 *     get:
 *       description: return all companies
 *     produces:
 *          - application/json
 *     responses:
 *          200:
 *              description: object comapny containing an array of company details
 */
app.get('/company', async (req, res) => {
  try {

    const result = await pool.query("select * from company");
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    const errResponse = { result: 'failed', message: 'Error fetching company' };
    res.status(500).json(errResponse);
  }
});



/**
* @swagger
* /agents/{code}:
*    put:
*       description: used to update data to compnay table
*       parameters:
*          - in: path
*            name: code
*            required: true
*            description: Company Id is required
*            schema:
*               type: string
*       requestBody:
*             required: true
*             content:
*                  application/json:
*                      schema:
*                          $ref: '#components/schemas/CompanyPut'
*    responses:
*          200:
*              description: company updated
*              content:
*                  application/json:
*                      schema:
*                          type: object
*                          items:
*                              $ref: '#components/schemas/Company'
*          404:
*              description: company not found in database
*          500:
*              description: error updating the company  
*          422:
*              description: validation error   
*/

app.put('/company/:id', validateCompanyIdParam, validateCompanyPut, async (req, res) => {
  let response = { result: 'failed', message: 'Error updating data' };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const reqbody = req.body;
    const sql = "UPDATE company SET COMPANY_NAME = '" + reqbody.companyName + "', COMPANY_CITY = '" + reqbody.companyCity  + "' WHERE  COMPANY_ID = '" + req.params.id + "'";

    const result = await pool.query(sql);

    if (result.affectedRows) {
      response = { result: 'ok' };
      res.status(200);
    } else {
      res.status(404);
      response.message = "Company not found in the database";
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (err) {
    response.message = err.message;
    res.status(500);
    res.json(response);
  }
});

/**
 * @swagger
 * /company:
 *    post:
 *       description: insert a record into company
 *       requestBody:
 *             required: true
 *             content: 
 *                  application/json:
 *                      schema:
 *                          $ref: '#components/schemas/Company'
 *    responses:
 *          200:
 *              description: company created
 *          422:
 *              description: validation error
 *          500:
 *              description: error inserting the company
 */

app.post('/company', validateCompany, async (req, res) => {
  let response = { result: 'failed', message: 'Error inserting company' };

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const reqbody = req.body;
    const insertData = "insert into company (COMPANY_ID, COMPANY_NAME, COMPANY_CITY) VALUES ('" + reqbody.companyId + "', '" + reqbody.companyName + "', '" + reqbody.companyCity + "')";
    const result = await pool.query(insertData);

    if (result.affectedRows) {
      response = { result: 'ok' };
      res.status(200);
    } else {
      res.status(500);
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (err) {
    response.message = err.message;
    res.status(500);
    res.json(response);
  }
});

/**
 * @swagger
 * /agents/{code}:
 *    patch:
 *       description: used to update partial data to company row
 *       parameters:
 *          - in: path
 *            name: code
 *            required: true
 *            description: Company Id is required
 *            schema:
 *               type: string
 *       requestBody:
 *             required: true
 *             content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#components/schemas/CompanyPatch'
 *    responses:
 *          200:
 *            description: company updated with name and city
 *            content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          items:
 *                              $ref: '#components/schemas/CompanyPatch'
 *          404:
 *              description: company not found in database
 *          500:
 *              description: error updating the company data 
 *          422:
 *              description: validation error
 */

app.patch('/company/:id', validateCompanyIdParam, validateCompanyPatch, async (req, res) => {
  let response = { result: 'failed', message: 'Error updating company name and city' };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const reqbody = req.body;

    const sql = "UPDATE company SET COMPANY_NAME = '" + reqbody.companyName + "' WHERE COMPANY_ID = '" + req.params.id + "'";

    const result = await pool.query(sql);

    if (result.affectedRows) {
      response = { result: 'ok' };
      res.status(200);
    } else {
      res.status(404);
      response.message = "Company is not found in the database";
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (err) {
    response.message = err.message;
    res.status(500);
    res.json(response);
  }
});

/**
* @swagger
* /company/{id}:
*    delete:
*       description: used to delete record from company table
*       parameters:
*          - in: path
*            name: code
*            required: true
*            description: Company Id is required
*            schema:
*               type: string
*    responses:
*          200:
*              description: company deleted
*          404:
*              description: company is not found in database
*          500:
*              description: error in deleting the company 
*          422:
*              description: path parameter validation error
*/

app.delete('/company/:id', validateCompanyIdParam, async (req, res) => {
  let response = { result: 'failed', message: 'Error deleting company' };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const sql = "DELETE FROM company WHERE COMPANY_ID = '" + req.params.id + "'";

    const result = await pool.query(sql);

    if (result.affectedRows) {
      response = { result: 'ok' };
      res.status(200);
    } else {
      res.status(404);
      response.message = "Company is not found in the database";
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (err) {
    response.message = err.message;
    res.status(500);
    res.json(response);
  }
});

/**
 * @swagger
 * /customers:
 *     get:
 *       description: return all customers details
 *       produces:
 *          - application/json
 *     responses:
 *          200:
 *              description: object customer containing an array of customer data
 *          500:
 *              description: error in getting customers data
 */
app.get('/customers', async (req, res) => {
  try {
    const result = await pool.query("select * from customer");
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    const errResponse = { result: 'failed', message: 'Error in getting customers data' };
    res.status(500).json(errResponse);
  }
});

/**
 * @swagger
 * /orders:
 *     get:
 *       description: return all orders details
 *       produces:
 *          - application/json
 *     responses:
 *          200:
 *              description: object order containing an array of orders data
 *          500: 
 *              description: Error in getting orders data
 */
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query("select * from orders");
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    const errResponse = { result: 'failed', message: 'Error in getting orders data' };
    res.status(500).json(errResponse);
  }
});

/**
 * @swagger
 * /company:
 *     get:
 *       description: return all companies
 *     produces:
 *          - application/json
 *     responses:
 *          200:
 *              description: object comapny containing an array of company details
 */
app.get('/say', async (req, res) => {
  try {
    const axios = require('axios');

    let response = await axios.get('https://b9llx4z1o8.execute-api.us-east-2.amazonaws.com/qa/getresponse?keyword=' + req.query.keyword);
    let data = response.data;

    console.log(data)
    console.log(req.query.keyword)
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
    
  } catch (err) {
    const errResponse = { result: 'failed', message: 'Error speaking' };
    res.status(500).json(errResponse);
  }
});

app.use(function (req, res) {
  res.status(404).send('Error! 404 request not found!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});

