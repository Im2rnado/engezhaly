# Create Session

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
    "/payment-intent/api/v2/direct/session": {
      "post": {
        "summary": "Create Session",
        "description": "",
        "operationId": "create-session-v2",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amount",
                  "currency",
                  "signature"
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
                  "metadata": {
                    "type": "object",
                    "description": "Object that contain parameter to pass additional custom data",
                    "properties": {
                      "custom": {
                        "type": "string",
                        "description": "Custom value that can be passed in the request"
                      }
                    }
                  },
                  "appearance": {
                    "type": "object",
                    "description": "This object allows you to modify the appearance of the Geidea Checkout payment widget.",
                    "properties": {
                      "merchant": {
                        "type": "object",
                        "description": "An object containing parameters for merchant details customization on HPP",
                        "properties": {
                          "name": {
                            "type": "string",
                            "description": "A value indicating the name the merchant name displayed on HPP"
                          },
                          "logoUrl": {
                            "type": "string",
                            "description": "A value indicating the merchant logo Url to be passed and displayed on HPP"
                          }
                        }
                      },
                      "showEmail": {
                        "type": "boolean",
                        "description": "A boolean value indicating whether the email field should be displayed on the payment page.",
                        "enum": [
                          "true",
                          "false"
                        ]
                      },
                      "showAddress": {
                        "type": "boolean",
                        "description": "A boolean value indicating whether the address fields should be displayed on the payment page.",
                        "enum": [
                          "true",
                          "false"
                        ]
                      },
                      "showPhone": {
                        "type": "boolean",
                        "description": "A boolean value indicating whether the customer phone field should be displayed on the payment page.",
                        "enum": [
                          "true",
                          "false"
                        ]
                      },
                      "receiptPage": {
                        "type": "boolean",
                        "description": "A boolean value indicating whether the payment receipt page should be displayed after the payment is completed.",
                        "enum": [
                          "true",
                          "false"
                        ]
                      },
                      "uiMode": {
                        "type": "string",
                        "description": "Specifies the appearance of the HPP. Use 'dropin' to display a simplified version without the merchant logo and name. Use 'modal' to show the full version, including the merchant logo and name.",
                        "default": "modal",
                        "enum": [
                          "modal",
                          "dropin",
                          "redirection"
                        ]
                      },
                      "styles": {
                        "type": "object",
                        "description": "This object will allow you to style the HPP page to be displayed differently",
                        "properties": {
                          "headerColor": {
                            "type": "string",
                            "description": "Hexadecimal color value that will allow you to update the header color of HPP"
                          },
                          "hppProfile": {
                            "type": "string",
                            "description": "A value that changes the shape of the HPP. Available types are: simple or compressed"
                          },
                          "hideGeideaLogo": {
                            "type": "boolean",
                            "description": "A boolean value indicating whether to hide Geidea Logo from the bottom of the HPP page. Default is false"
                          }
                        }
                      }
                    }
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
                  },
                  "subscriptionId": {
                    "type": "string",
                    "description": "The subscription Id for which the payment is initiated. Must be a valid GUID.  Subscription ID (generated from the create subscription API) can be passed in the request to capture the card on file details during the first transaction and later Geidea will auto-debit the customers as per the set frequency and interval based on securely stored token."
                  },
                  "returnUrl": {
                    "type": "string",
                    "description": "A URL that can be used to redirect to a different page after the transaction has been completed",
                    "default": "https://www.geidea.net"
                  },
                  "customer": {
                    "type": "object",
                    "description": "Customer object that specifies all details of the customer",
                    "properties": {
                      "email": {
                        "type": "string",
                        "description": "The email of the customer that can be collected in the transaction details",
                        "default": "customer@email.com"
                      },
                      "phoneNumber": {
                        "type": "string",
                        "description": "The phone number of the customer that can be collected in the transaction details",
                        "default": "+966501231231"
                      },
                      "phoneCountryCode": {
                        "type": "string",
                        "description": "Country Code of the phone number of the customer",
                        "default": "+966"
                      },
                      "firstName": {
                        "type": "string",
                        "description": "A value indicating the customer's first name"
                      },
                      "lastName": {
                        "type": "string",
                        "description": "A value indicating the customer's last name"
                      },
                      "address": {
                        "type": "object",
                        "description": "The address of the customer including the shipping & billing addresses",
                        "properties": {
                          "billing": {
                            "type": "object",
                            "description": "The billing address of the customer to be collected in the transaction details",
                            "properties": {
                              "country": {
                                "type": "string",
                                "description": "The country code for the billing address of the customer. For example, \"SAU\" for Saudi Arabia"
                              },
                              "city": {
                                "type": "string",
                                "description": "The city name for the billing address of the customer."
                              },
                              "street": {
                                "type": "string",
                                "description": "The street name for the billing address of the customer."
                              },
                              "postalCode": {
                                "type": "string",
                                "description": "The postal code for the billing address of the customer."
                              }
                            }
                          },
                          "shipping": {
                            "type": "object",
                            "description": "The shipping address of the customer to be collected in the transaction details",
                            "properties": {
                              "country": {
                                "type": "string",
                                "description": "The country code for the shipping address of the customer. For example, \"SAU\" for Saudi Arabia"
                              },
                              "city": {
                                "type": "string",
                                "description": "The city name for the shipping address of the customer."
                              },
                              "street": {
                                "type": "string",
                                "description": "The street name for the shipping address of the customer."
                              },
                              "postalCode": {
                                "type": "string",
                                "description": "The postal code for the shipping address of the customer."
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  "cofAgreement": {
                    "type": "object",
                    "description": "Agreement object to specify the details of the agreement between the merchant & a customer for a specific transaction",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "An id that can be used to make an agreement merchant & a customer for a specific transaction"
                      },
                      "type": {
                        "type": "string",
                        "description": "The type of agreement of a specific transaction. The value that can be used is \"Unscheduled\""
                      }
                    }
                  },
                  "initiatedBy": {
                    "type": "string",
                    "description": "A value indicating whether the request is started from Customer(Internet) or Merchant.",
                    "default": "Internet",
                    "enum": [
                      "Internet",
                      "Merchant"
                    ]
                  },
                  "tokenid": {
                    "type": "string",
                    "description": "Tokenid that can be passed to create session for a CIT token payment or MIT unscheduled payment"
                  },
                  "platform": {
                    "type": "object",
                    "description": "Details of the platform used to run the payment page",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "Name of the platform the payment page is launched on"
                      },
                      "version": {
                        "type": "string",
                        "description": "Version number of the platform"
                      },
                      "pluginVersion": {
                        "type": "string",
                        "description": "The plugin version of the payment page"
                      },
                      "partnerId": {
                        "type": "string"
                      }
                    }
                  },
                  "paymentOptions": {
                    "type": "array",
                    "description": "A list of available of option to make available on the payment page",
                    "items": {
                      "type": "object",
                      "properties": {
                        "label": {
                          "type": "string",
                          "description": "Label to show the payment method option as on the payment page",
                          "enum": [
                            "Valu",
                            "Souhoola",
                            "GooglePay",
                            "StcPay",
                            "Tamara",
                            "Tabby",
                            "MeezaDigital",
                            "bankinstallment"
                          ]
                        },
                        "paymentMethods": {
                          "type": "string",
                          "description": "The payment method to display on the payment page. For example, 'visa', 'mastercard',... etc",
                          "default": "",
                          "enum": [
                            "meezadigital",
                            "valu",
                            "souhoola",
                            "googlepay",
                            "stcpay",
                            "tamara",
                            "tabby",
                            "bankinstallment"
                          ]
                        }
                      }
                    }
                  },
                  "hideWallets": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "This parameter hides the device payment, and it should be passed correctly apple-pay / google-pay / samsung-pay"
                  },
                  "order": {
                    "type": "object",
                    "description": "The object indicating details of the order",
                    "properties": {
                      "integrationType": {
                        "type": "string",
                        "description": "A value indicating the type of integration of the payment gateway for this order"
                      },
                      "description": {
                        "type": "string",
                        "description": "A value to add a description of the order"
                      },
                      "summary": {
                        "type": "object",
                        "description": "An object indicating summary details of the orders",
                        "properties": {
                          "subTotal": {
                            "type": "float",
                            "description": "A the subtotal value of the order"
                          },
                          "shipping": {
                            "type": "string",
                            "description": "The shipping details of the order"
                          },
                          "vat": {
                            "type": "float",
                            "description": "A VAT value if applicable for the order"
                          }
                        }
                      },
                      "statementDescriptor": {
                        "type": "object",
                        "description": "A value indicating the statement details",
                        "properties": {
                          "name": {
                            "type": "string",
                            "description": "A value for the customer name"
                          },
                          "phone": {
                            "type": "string",
                            "description": "A value of the customer's phone number"
                          }
                        }
                      },
                      "items": {
                        "type": "array",
                        "description": "List of item objects",
                        "items": {
                          "type": "object",
                          "properties": {
                            "merchantitemId": {
                              "type": "string",
                              "description": "Id of the merchant's item"
                            },
                            "name": {
                              "type": "string",
                              "description": "The name of the item"
                            },
                            "description": {
                              "type": "string",
                              "description": "Description of the item"
                            },
                            "categories": {
                              "type": "string",
                              "description": "Categories that the item belongs to"
                            },
                            "count": {
                              "type": "string",
                              "description": "Quantity of the item"
                            },
                            "price": {
                              "type": "float",
                              "description": "Price per one quantity of the item"
                            },
                            "sku": {
                              "type": "string",
                              "description": "The SKU of the item"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "examples": {
                "Request Example": {
                  "value": {
                    "amount": 1850,
                    "currency": "EGP",
                    "language": "en",
                    "timestamp": "2/21/2024 5:16:48 AM",
                    "callbackUrl": "https://webhook.site/8ef88a07-b575-40a4-9a27-f2e78edf931e",
                    "merchantReferenceId": "10",
                    "paymentIntentId": null,
                    "paymentOperation": "Pay",
                    "cardOnFile": false,
                    "appearance": {
                      "showEmail": false,
                      "showAddress": false,
                      "showPhone": false,
                      "receiptPage": false,
                      "styles": {
                        "hideGeideaLogo": false
                      },
                      "uiMode": "modal"
                    },
                    "signature": "tF04+uS/SE+z4Bx6JxtO7UAd/srkX9KK7pM3Ertp2iM="
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"session\": {\n        \"id\": \"f1a0f785-7601-4d53-8f43-08dc33d8302c\",\n        \"amount\": 1850,\n        \"currency\": \"EGP\",\n        \"callbackUrl\": \"https://webhook.site/8ef88a07-b575-40a4-9a27-f2e78edf931e\",\n        \"returnUrl\": null,\n        \"expiryDate\": \"2024-03-04T14:28:52.0623131Z\",\n        \"status\": \"Initiated\",\n        \"merchantId\": \"4907f9f6-af43-434a-340a-08da8933ece3\",\n        \"merchantPublicKey\": \"40225a89-be31-4f2e-a10a-27b2bbc4e3b3\",\n        \"language\": \"en\",\n        \"merchantReferenceId\": \"10\",\n        \"paymentIntentId\": null,\n        \"paymentOperation\": \"Pay\",\n        \"cardOnFile\": false,\n        \"cofAgreement\": {\n            \"id\": null,\n            \"type\": null\n        },\n        \"initiatedBy\": null,\n        \"tokenId\": null,\n        \"customer\": null,\n        \"platform\": {\n            \"name\": null,\n            \"version\": null,\n            \"pluginVersion\": null,\n            \"partnerId\": null\n        },\n        \"paymentOptions\": null,\n        \"recurrence\": null,\n        \"order\": null,\n        \"items\": null,\n        \"appearance\": {\n            \"merchant\": {\n                \"name\": null,\n                \"logoUrl\": null\n            },\n            \"showEmail\": false,\n            \"showAddress\": false,\n            \"showPhone\": false,\n            \"receiptPage\": false,\n            \"styles\": {\n                \"headerColor\": null,\n                \"hppProfile\": null,\n                \"hideGeideaLogo\": false\n            }\n        },\n        \"metadata\": {\n            \"custom\": null\n        },\n        \"paymentMethod\": {\n            \"cardNumber\": null,\n            \"cardholderName\": null,\n            \"cvv\": null,\n            \"expiryDate\": {\n                \"month\": null,\n                \"year\": null\n            }\n        },\n        \"subscription\": null\n    },\n    \"responseMessage\": \"Success\",\n    \"detailedResponseMessage\": \"The operation was successful\",\n    \"language\": \"EN\",\n    \"responseCode\": \"000\",\n    \"detailedResponseCode\": \"000\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "session": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "f1a0f785-7601-4d53-8f43-08dc33d8302c"
                        },
                        "amount": {
                          "type": "integer",
                          "example": 1850
                        },
                        "currency": {
                          "type": "string",
                          "example": "EGP"
                        },
                        "callbackUrl": {
                          "type": "string",
                          "example": "https://webhook.site/8ef88a07-b575-40a4-9a27-f2e78edf931e"
                        },
                        "returnUrl": {},
                        "expiryDate": {
                          "type": "string",
                          "example": "2024-03-04T14:28:52.0623131Z"
                        },
                        "status": {
                          "type": "string",
                          "example": "Initiated"
                        },
                        "merchantId": {
                          "type": "string",
                          "example": "4907f9f6-af43-434a-340a-08da8933ece3"
                        },
                        "merchantPublicKey": {
                          "type": "string",
                          "example": "40225a89-be31-4f2e-a10a-27b2bbc4e3b3"
                        },
                        "language": {
                          "type": "string",
                          "example": "en"
                        },
                        "merchantReferenceId": {
                          "type": "string",
                          "example": "10"
                        },
                        "paymentIntentId": {},
                        "paymentOperation": {
                          "type": "string",
                          "example": "Pay"
                        },
                        "cardOnFile": {
                          "type": "boolean",
                          "example": false,
                          "default": true
                        },
                        "cofAgreement": {
                          "type": "object",
                          "properties": {
                            "id": {},
                            "type": {}
                          }
                        },
                        "initiatedBy": {},
                        "tokenId": {},
                        "customer": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string"
                            },
                            "referenceId": {
                              "type": "string"
                            },
                            "create": {
                              "type": "boolean"
                            },
                            "setDefaultMethod": {
                              "type": "boolean"
                            },
                            "email": {
                              "type": "string",
                              "default": "customer@email.com"
                            },
                            "phoneNumber": {
                              "type": "string",
                              "default": "+966501231231"
                            },
                            "firstName": {
                              "type": "string"
                            },
                            "lastName": {
                              "type": "string"
                            },
                            "address": {
                              "type": "object",
                              "properties": {
                                "billing": {
                                  "type": "object",
                                  "properties": {
                                    "country": {
                                      "type": "string"
                                    },
                                    "city": {
                                      "type": "string"
                                    },
                                    "street": {
                                      "type": "string"
                                    },
                                    "postalCode": {
                                      "type": "string"
                                    }
                                  }
                                },
                                "shipping": {
                                  "type": "object",
                                  "properties": {
                                    "country": {
                                      "type": "string"
                                    },
                                    "city": {
                                      "type": "string"
                                    },
                                    "street": {
                                      "type": "string"
                                    },
                                    "postalCode": {
                                      "type": "string"
                                    }
                                  }
                                }
                              }
                            }
                          }
                        },
                        "platform": {
                          "type": "object",
                          "properties": {
                            "name": {},
                            "version": {},
                            "pluginVersion": {},
                            "partnerId": {}
                          }
                        },
                        "paymentOptions": {},
                        "recurrence": {
                          "type": "object",
                          "description": "If not passed in the original session creation. The default value will be null",
                          "properties": {
                            "amount": {
                              "type": "integer"
                            },
                            "currency": {
                              "type": "string"
                            },
                            "cycleInterval": {
                              "type": "string"
                            },
                            "frequency": {
                              "type": "integer"
                            },
                            "typeOfPayment": {
                              "type": "string"
                            },
                            "startDate": {
                              "type": "string"
                            },
                            "endDate": {
                              "type": "string"
                            },
                            "numberOfPayments": {
                              "type": "integer"
                            },
                            "minimumDaysBetweenPayments": {
                              "type": "integer"
                            },
                            "description": {
                              "type": "string"
                            }
                          }
                        },
                        "order": {
                          "type": "object",
                          "properties": {
                            "integrationType": {
                              "type": "string"
                            },
                            "description": {
                              "type": "string"
                            },
                            "summary": {
                              "type": "object",
                              "properties": {
                                "subTotal": {
                                  "type": "integer"
                                },
                                "shipping": {
                                  "type": "integer"
                                },
                                "vat": {
                                  "type": "integer"
                                }
                              }
                            },
                            "statementDescriptor": {
                              "type": "object",
                              "properties": {
                                "name": {
                                  "type": "string"
                                },
                                "phone": {
                                  "type": "string"
                                }
                              }
                            },
                            "items": {
                              "type": "array",
                              "items": {
                                "properties": {
                                  "merchantItemId": {
                                    "type": "string"
                                  },
                                  "name": {
                                    "type": "string"
                                  },
                                  "description": {
                                    "type": "string"
                                  },
                                  "categories": {
                                    "type": "string"
                                  },
                                  "count": {
                                    "type": "integer"
                                  },
                                  "price": {
                                    "type": "integer"
                                  },
                                  "sku": {
                                    "type": "string"
                                  }
                                }
                              }
                            }
                          }
                        },
                        "appearance": {
                          "type": "object",
                          "properties": {
                            "merchant": {
                              "type": "object",
                              "properties": {
                                "name": {},
                                "logoUrl": {}
                              }
                            },
                            "showEmail": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "showAddress": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "showPhone": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "receiptPage": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "styles": {
                              "type": "object",
                              "properties": {
                                "headerColor": {},
                                "hppProfile": {},
                                "hideGeideaLogo": {
                                  "type": "boolean",
                                  "example": false,
                                  "default": true
                                }
                              }
                            }
                          }
                        },
                        "metadata": {
                          "type": "object",
                          "properties": {
                            "custom": {}
                          }
                        },
                        "paymentMethod": {
                          "type": "object",
                          "properties": {
                            "cardNumber": {},
                            "cardholderName": {},
                            "cvv": {},
                            "expiryDate": {
                              "type": "object",
                              "properties": {
                                "month": {},
                                "year": {}
                              }
                            }
                          }
                        },
                        "subscription": {
                          "type": "object",
                          "properties": {
                            "number": {
                              "type": "string"
                            },
                            "typeOfPayment": {
                              "type": "string"
                            },
                            "occurenceType": {
                              "type": "string"
                            },
                            "subscriptionid": {
                              "type": "string"
                            },
                            "description": {
                              "type": "string"
                            },
                            "startDate": {
                              "type": "string"
                            },
                            "endDate": {
                              "type": "string"
                            },
                            "cycleInterval": {
                              "type": "string"
                            },
                            "cycleFrequencey": {
                              "type": "integer"
                            },
                            "numberOfPayments": {
                              "type": "integer"
                            },
                            "recurringPaymentAmount": {
                              "type": "double"
                            },
                            "currency": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    },
                    "responseMessage": {
                      "type": "string",
                      "example": "Success"
                    },
                    "detailedResponseMessage": {
                      "type": "string",
                      "example": "The operation was successful"
                    },
                    "language": {
                      "type": "string",
                      "example": "EN"
                    },
                    "responseCode": {
                      "type": "string",
                      "example": "000"
                    },
                    "detailedResponseCode": {
                      "type": "string",
                      "example": "000"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"responseMessage\": \"HPP Integration error\",\n    \"detailedResponseMessage\": \"Invalid amount\",\n    \"language\": \"EN\",\n    \"responseCode\": \"110\",\n    \"detailedResponseCode\": \"003\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "responseMessage": {
                      "type": "string",
                      "example": "HPP Integration error"
                    },
                    "detailedResponseMessage": {
                      "type": "string",
                      "example": "Invalid amount"
                    },
                    "language": {
                      "type": "string",
                      "example": "EN"
                    },
                    "responseCode": {
                      "type": "string",
                      "example": "110"
                    },
                    "detailedResponseCode": {
                      "type": "string",
                      "example": "003"
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "parameters": [
          {
            "in": "header",
            "name": "deviceBrand",
            "schema": {
              "type": "string"
            },
            "description": "For instance Apple"
          },
          {
            "in": "header",
            "name": "deviceModel",
            "schema": {
              "type": "string"
            },
            "description": "For instance 14 Pro"
          },
          {
            "in": "header",
            "name": "deviceType",
            "schema": {
              "type": "string"
            },
            "description": "For instance iPhone"
          },
          {
            "in": "header",
            "name": "language",
            "schema": {
              "type": "string"
            },
            "description": "For instance en or ar"
          },
          {
            "in": "header",
            "name": "sdkVersion",
            "schema": {
              "type": "string"
            },
            "description": "For instance 1.0.0"
          },
          {
            "in": "header",
            "name": "OSVersion",
            "schema": {
              "type": "string"
            },
            "description": "For instance 18.0"
          }
        ]
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