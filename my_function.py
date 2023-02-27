import json

def lambda_handler(event, context):
    
    # Get Keyword from QueryStringParameters
    keyword = event['queryStringParameters']['keyword']
    
    # Build body or response
    saySomethingResponse = {}
    saySomethingResponse['message'] = 'Angie Jordan Smith Says ... ' + keyword
    
    # Construct HTTP reponse object
    responseObject = {}
    responseObject['statusCode'] = 200
    responseObject['headers'] = {}
    responseObject['headers']['Content-Type'] = 'application/json'
    responseObject['body'] = json.dumps(saySomethingResponse)
    
    # Return the HTTP response object
    return responseObject