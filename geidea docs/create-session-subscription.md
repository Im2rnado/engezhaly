# Create Session - Subscription

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "CHECKOUT  - V2",
    "version": "2.0"
  },
  "servers": [
    {
      "url": "https://api.ksamerchant.geidea.net",
      "description": "Saudi Arabia - Production"
    },
    {
      "url": "https://api.geidea.ae",
      "description": "UAE - Production"
    },
    {
      "url": "https://api.merchant.geidea.net",
      "description": "Egypt - Production"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "http",
        "scheme": "basic"
      }
    }
  },
  "security": [
    {
      "sec0": []
    }
  ],
  "paths": {
    "/payment-intent/api/v2/direct/session-subscription": {
      "post": {
        "summary": "Create Session - Subscription",
        "description": "",
        "operationId": "create-session-subscription",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amount",
                  "currency",
                  "signature",
                  "subscriptionId"
                ],
                "properties": {
                  "amount": {
                    "type": "number",
                    "description": "The total amount value of the payment. This parameter is required, and the format is a double - a number with 2 digits after the decimal point. For example 19.99",
                    "default": 1850,
                    "format": "float"
                  },
                  "currency": {
                    "type": "string",
                    "description": "The currency of the payment. This is a 3-digit alphabetic code, following the ISO 4217 currency code standard. For example: SAR",
                    "default": "SAR"
                  },
                  "timestamp": {
                    "type": "string",
                    "description": "The timestamp of the moment at which the create session request has been initiated.",
                    "default": "2/21/2024 5:16:48 AM"
                  },
                  "merchantReferenceId": {
                    "type": "string",
                    "description": "The unique identifier for the session given added by the merchant. Must be a valid UUID",
                    "default": "10"
                  },
                  "signature": {
                    "type": "string",
                    "description": "A parameter to ensure the security and authenticity of API communications. It involves generating a signature using the contents of the API request and secret keys, which is then sent along with the request.",
                    "default": "tF04+uS/SE+z4Bx6JxtO7UAd/srkX9KK7pM3Ertp2iM="
                  },
                  "subscriptionId": {
                    "type": "string",
                    "description": "The subscription Id for which the payment is initiated. Must be a valid GUID.  Subscription ID (generated from the create subscription API) can be passed in the request to capture the card on file details during the first transaction and later Geidea will auto-debit the customers as per the set frequency and interval based on securely stored token."
                  },
                  "paymentIntentId": {
                    "type": "string",
                    "description": "If you have previously generated a payment intent, you can use this parameter to link your order to the payment intent. This will process a payment for the specified payment intent."
                  },
                  "paymentOperation": {
                    "type": "string",
                    "description": "The type of payment operation to be performed. This is an optional parameter - if not submitted, the Geidea gateway will process a 'Pay' operation by default.",
                    "default": "Pay",
                    "enum": [
                      "Pay",
                      "PreAuthorize",
                      "AuthorizeCapture"
                    ]
                  },
                  "cardOnFile": {
                    "type": "boolean",
                    "description": "Indicates whether to store the payment method for future use. If you pass 'true' in this field, Geidea will save the card and will return a tokenId in the callback after the order. This tokenId can be used later to process a payment for the same customer using the saved payment method."
                  },
                  "language": {
                    "type": "string",
                    "description": "The language to be used on the checkout page.",
                    "default": "en",
                    "enum": [
                      "en",
                      "ar"
                    ]
                  },
                  "callbackUrl": {
                    "type": "string",
                    "description": "The URL where the payment gateway should send the callback after the transaction is completed. It must have a valid SSL certificate and start with 'https://'",
                    "default": "https://www.callbackurl.com"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true,
    "samples-enabled": true
  }
}
```