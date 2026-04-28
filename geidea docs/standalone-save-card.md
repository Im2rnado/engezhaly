# Standalone Save Card

<br />

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
    "/payment-intent/api/v2/direct/session/saveCard": {
      "post": {
        "description": "",
        "operationId": "post_payment-intentapiv2directsessionsaveCard",
        "responses": {
          "200": {
            "description": ""
          }
        },
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
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "currency": {
                    "type": "string",
                    "enum": [
                      "EGP",
                      "SAR",
                      "AED"
                    ],
                    "default": "EGP"
                  },
                  "callbackUrl": {
                    "type": "string"
                  },
                  "returnUrl": {
                    "type": "string"
                  },
                  "language": {
                    "type": "string",
                    "enum": [
                      "en",
                      "ar"
                    ]
                  },
                  "merchantReferenceId": {
                    "type": "string"
                  },
                  "signature": {
                    "type": "string",
                    "default": "ENif6Ew2pXCCP1ToOs1VN9xBW7xZeV88ee+Mrd2rrXs="
                  },
                  "timeStamp": {
                    "type": "string",
                    "default": "10/20/2025 5:16:48 AM"
                  },
                  "cofAgreement": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "type": {
                        "type": "string",
                        "enum": [
                          "Unscheduled"
                        ]
                      }
                    }
                  },
                  "appearance": {
                    "type": "array",
                    "items": {
                      "properties": {
                        "receiptPage": {
                          "type": "boolean",
                          "enum": [
                            true,
                            false
                          ]
                        },
                        "uiMode": {
                          "type": "string",
                          "enum": [
                            "modal",
                            "dropin"
                          ]
                        },
                        "styles": {
                          "type": "object",
                          "properties": {
                            "hideGeideaLogo": {
                              "type": "boolean",
                              "enum": [
                                true,
                                false
                              ]
                            }
                          }
                        }
                      },
                      "type": "object"
                    }
                  }
                },
                "required": [
                  "currency",
                  "signature",
                  "timeStamp"
                ]
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