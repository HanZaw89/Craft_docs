This markdown contains up to 5 most recently updated documents from the multi-document connection, followed by the API documentation for interacting with them.

# Document Content (for reference only, use the API below for up-to-date data)

## Life Progress

```json
[
  {
    "id": "59670A5F-438E-41C8-8586-3EFAAC463ABF",
    "type": "page",
    "textStyle": "page",
    "styling": {
      "fontFamily": "system",
      "backgroundColor": "#FFFFFF #222222",
      "backdrop": "none",
      "themeId": "default",
      "separatorStyle": "line"
    },
    "markdown": "Life Progress",
    "content": [
      {
        "id": "94139A4F-FD43-4E1C-805C-67BB93BF8F19",
        "type": "text",
        "markdown": ""
      }
    ]
  }
]
```

# Documentation of the Craft Multi-Document API

## Craft – API for My API

**Version:** 1.0.0

### Overview
The Craft Multi-Document API provides programmatic access to multiple Craft documents. Access documents, blocks, collections, and search across your document set with unified authentication.

### Key Concepts

**Document IDs**: Each document is identified by an ID. Use `GET /documents` to discover available documents and their IDs.

**Cross-Document Operations**: Most operations require specifying which document to work with via block IDs. The API automatically resolves which document a block belongs to.

### Recommended Usage
This API is ideal for building integrations that need to work with multiple related documents, such as project documentation sets, knowledge bases, or multi-document workflows.

### Craft Markdown Extensions
The `markdown` field on blocks uses standard Markdown with the following Craft-specific extensions. These tags can appear in both input (when creating/updating blocks) and output (when reading blocks), unless noted otherwise.

#### Page Structure
| Tag | Description |
|-----|-------------|
| `<page>...<\/page>` | A nested page (sub-document). Optional attributes: `textStyle` (e.g. `"card"`), `cardLayout`, `id`. |
| `<card>...<\/card>` | Shorthand for `<page textStyle="card">`. |
| `<pageTitle>...<\/pageTitle>` | The title of a `<page>`. Always the first child inside `<page>`. |
| `<content>...<\/content>` | The body content of a `<page>`, following `<pageTitle>`. |

#### Block-Level Formatting
| Tag | Description |
|-----|-------------|
| `<callout>...<\/callout>` | Wraps blocks in a visually distinct callout box (similar to an admonition or aside). |
| `<caption>...<\/caption>` | Renders text in a smaller, muted caption style. |

#### Inline Formatting
| Tag | Description |
|-----|-------------|
| `<highlight color="...">...<\/highlight>` | Colored text highlight. Colors: yellow, green, mint, cyan, blue, purple, pink, red, gray, gradient-blue, gradient-purple, gradient-red, gradient-yellow, gradient-brown. |
| `==text==` | Shorthand for `<highlight color="yellow">`. |
| `<comment id="...">...<\/comment>` | Marks text that has a comment thread attached. The `id` references the comment thread. |
| `$formula$` or `$$formula$$` | LaTeX math formula, rendered inline or as a block. |

#### Links and Indentation
| Syntax | Description |
|--------|-------------|
| `[text](block://blockId)` | Cross-reference to another block by ID. Appears as `[text](invalid:out_of_scope)` when the target block is outside the current API scope. |
| `[text](date://YYYY-MM-DD)` | Link to a daily note for the given date. |
| 2+ leading spaces | Nesting level. Every 2 spaces represents one level of indentation. |

#### Collection Tags (output-only)
These tags appear only in responses, when the result contains collection data. They are not accepted as input.

| Tag | Description |
|-----|-------------|
| `<collection>...<\/collection>` | A collection (structured database). Contains `<title>`, `<properties>`, and either `<content>` (with items) or `<itemsPreview>`. |
| `<title>...<\/title>` | The name of a collection or collection item. |
| `<properties>...<\/properties>` | Comma-separated list of property (column) keys defined on the collection. |
| `<collectionItem>...<\/collectionItem>` | A single row/item in a collection. Contains `<property>` tags, a `<title>`, and optionally `<content>` or `<contentPreview>`. |
| `<property name="key">value<\/property>` | A property value on a collection item, where `name` is the property key. |
| `<contentPreview>...<\/contentPreview>` | A truncated preview of nested content, included when the response depth limit is reached instead of the full `<content>`. |
| `<itemsPreview>...<\/itemsPreview>` | A truncated preview of collection items, included when the response depth limit is reached instead of the full item list. |

### Development Tips
- Start with `GET /documents` to discover available documents and their IDs
- Use the `id` parameter in `GET /blocks` with a document's ID to fetch that document's content
- When inserting blocks, use `pageId` in the position object to specify the target document/block
- Use `GET /documents/search` to search across all documents with relevance-based ranking
- Collections can span multiple documents - use `GET /collections` to discover them

### Note for AI
When implementing functionality using this API, always make actual calls to these endpoints and verify the responses. Do not simulate or mock the API interactions or use hard-coded values on the client-side - use the real endpoints to ensure proper functionality and data handling.

**IMPORTANT: This is a production server connected to real user data.** Only perform testing operations that can be safely rolled back:

- Safe: Reading data (`GET` requests), creating test content that you delete immediately after
- Safe: Modifying content if you can restore it to its original state
- Safe: Moving blocks if you can move them back to their original position
- Unsafe: Permanent deletions, modifications without backup, or any changes you cannot reverse

Always verify rollback operations work before considering a test complete.

### Servers

- https://connect.craft.do/links/G3m5KGCYJN8/api/v1
  API Server for My API

---

## Endpoints

## Fetch Blocks

`GET /blocks`

Fetches content from documents in this multi-document connection. Use 'id' query parameter to specify which block to fetch.

Use `Accept` header `application/json` for structured data, `text/markdown` for rendered content.

**Content Rendering:** Text blocks contain markdown formatting and may include Craft-specific structural tags (e.g. `<page>`, `<callout>`, `<highlight>`). See the **Craft Markdown Extensions** section in the API description for the full list of tags.

**Scope Filtering:** Block links in markdown and collections, as well as relations are filtered to documents scope. Block links and date links are returned as `block://` and `date://` URLs.

**Tip:** Start by calling GET /documents to list available documents, then use their documentId values as the 'id' parameter to fetch each document's root content.

### Parameters

- **id** (required) (query): string
  The ID of the page block to fetch. Required for multi-document operations. Accepts IDs for documents, pages and blocks.
- **maxDepth** (query): number
  The maximum depth of blocks to fetch. Default is -1 (all descendants). With a depth of 0, only the specified block is fetched. With a depth of 1, only direct children are returned.
- **fetchMetadata** (query): boolean
  Whether to fetch metadata (comments, createdBy, lastModifiedBy, lastModifiedAt, createdAt) for the blocks. Default is false.

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`

```json
{
  "id": "0",
  "type": "page",
  "textStyle": "page",
  "markdown": "<page>Document Title</page>",
  "content": [
    {
      "id": "1",
      "type": "text",
      "textStyle": "h1",
      "markdown": "# Main Section"
    },
    {
      "id": "2",
      "type": "text",
      "markdown": "This is some content in the document."
    },
    {
      "id": "3",
      "type": "page",
      "textStyle": "card",
      "markdown": "Subsection",
      "content": [
        {
          "id": "4",
          "type": "text",
          "markdown": "Nested content inside subsection."
        }
      ]
    }
  ]
}
```

---

## Insert Blocks

`POST /blocks`

Insert content into documents in this multi-document connection. Content can be provided as structured JSON blocks. Use position parameter to specify where to insert. Returns the inserted blocks with their assigned block IDs for later reference.

### Request Body

**Content-Type:** `application/json`


**Example: textBlock**

Insert block into specific document

```json
{
  "blocks": [
    {
      "type": "text",
      "markdown": "## Section Header\n\nContent for this document."
    }
  ],
  "position": {
    "position": "end",
    "pageId": "doc-123"
  }
}
```


**Example: markdown**

Insert markdown into document

```json
{
  "markdown": "## Section Header\n\nContent",
  "position": {
    "position": "end",
    "pageId": "doc-123"
  }
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "15",
      "type": "text",
      "textStyle": "body",
      "markdown": "## Second Level Header\n\n- **List Item A**: Description text\n- **List Item B**: Description text"
    },
    {
      "id": "16",
      "type": "image",
      "url": "https://res.luki.io/user/full/space-id/doc/doc-id/uuid",
      "altText": "Alt text for accessibility",
      "markdown": "![Image](https://res.luki.io/user/full/space-id/doc/doc-id/uuid)"
    }
  ]
}
```

---

## Delete Blocks

`DELETE /blocks`

Delete content from documents in this multi-document connection. Removes specified blocks by their IDs.

### Request Body

**Content-Type:** `application/json`

```json
{
  "blockIds": [
    "7",
    "9",
    "12"
  ]
}
```

### Responses

#### 200
Successfully deleted resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "7"
    },
    {
      "id": "9"
    },
    {
      "id": "12"
    }
  ]
}
```

---

## Update Blocks

`PUT /blocks`

Update content across documents in this multi-document connection. For text blocks, provide updated markdown content. Only the fields that are provided will be updated.

### Request Body

**Content-Type:** `application/json`

```json
{
  "blocks": [
    {
      "id": "5",
      "markdown": "## Updated Section Title\n\nThis content has been updated with new information.",
      "font": "serif"
    },
    {
      "id": "8",
      "markdown": "# New Heading"
    }
  ]
}
```

### Responses

#### 200
Successfully updated resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "5",
      "type": "text",
      "textStyle": "body",
      "markdown": "## Updated Section Title\n\nThis content has been updated with new information.",
      "font": "serif"
    },
    {
      "id": "8",
      "type": "text",
      "textStyle": "h2",
      "markdown": "# New Heading"
    }
  ]
}
```

---

## Move Blocks

`PUT /blocks/move`

Move blocks to reorder them or move them between documents. Returns the moved block IDs.

### Request Body

**Content-Type:** `application/json`

```json
{
  "blockIds": [
    "5",
    "6"
  ],
  "position": {
    "position": "end",
    "pageId": "doc-456"
  }
}
```

### Responses

#### 200
Successfully moved resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "5"
    },
    {
      "id": "6"
    }
  ]
}
```

---

## Search in Document

`GET /blocks/search`

Search content in one single Craft document. This is a secondary search tool that complements documents_search by allowing you to search within a single document.

### Parameters

- **documentId** (required) (query): string
  The document ID to search within.
- **pattern** (required) (query): string
  The search patterns to look for. Patterns must follow RE2-compatible syntax, which supports most common regular-expression features (literal text, character classes, grouping alternation, quantifiers, lookaheads, and fixed-width lookbehinds.
- **caseSensitive** (query): boolean
  Whether the search should be case sensitive. Default is false.
- **beforeBlockCount** (query): number
  The number of blocks to include before the matched block.
- **afterBlockCount** (query): number
  The number of blocks to include after the matched block.
- **fetchBlocks** (query): boolean
  Whether to include the full matched blocks with styling in the response. Default is false.

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`


**Example: withContext**

Search for 'Description' with context blocks

```json
{
  "items": [
    {
      "blockId": "109",
      "markdown": "List Item A: Description text",
      "pageBlockPath": [
        {
          "id": "0",
          "content": "Document Title"
        }
      ],
      "beforeBlocks": [
        {
          "blockId": "108",
          "markdown": "## Second Level Header"
        }
      ],
      "afterBlocks": [
        {
          "blockId": "110",
          "markdown": "List Item B: Description text"
        },
        {
          "blockId": "111",
          "markdown": "List Item C: Description text"
        }
      ]
    }
  ]
}
```

**Example: deeplyNested**

Search in deeply nested structure

```json
{
  "items": [
    {
      "blockId": "15",
      "markdown": "Match found here",
      "pageBlockPath": [
        {
          "id": "0",
          "content": "Document Title"
        },
        {
          "id": "12",
          "content": "Section Card"
        },
        {
          "id": "14",
          "content": "Nested Card"
        }
      ],
      "beforeBlocks": [
        {
          "blockId": "13",
          "markdown": "Previous content"
        }
      ],
      "afterBlocks": [
        {
          "blockId": "16",
          "markdown": "Following content"
        }
      ]
    }
  ]
}
```

---

## Search across Documents

`GET /documents/search`

Search content across multiple documents using relevance-based ranking. This endpoint uses FlexiSpaceSearch to find matches across the documents in your multi-document connection.

- Search across all documents or filter to specific documents
- Optional document filtering (include or exclude specific documents)
- Relevance-based ranking (top 20 results)
- Content snippets with match highlighting
- Returns exposedDocumentId for each result

**Example Use Cases:**
- Find all mentions of a topic across project documents
- Search for specific content excluding certain documents
- Locate references across a set of related documents

### Parameters

- **include** (query): string
  Search terms to include in the search. Can be a single string or array of strings.
- **regexps** (query): string
  Search terms to include in the search. Patterns must follow RE2-compatible syntax, which supports most common regular-expression features (literal text, character classes, grouping alternation, quantifiers, lookaheads, and fixed-width lookbehinds.
- **documentIds** (query): string
  The document IDs to filter. If not provided, all documents will be searched. Can be a single string or array of strings.
- **documentFilterMode** (query): string
  Whether to include or exclude the specified documents. Default is 'include'. Only used when documentIds is provided.
- **fetchBlocks** (query): boolean
  Whether to include the full matched blocks with styling and block IDs in each search result. Default is false.

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`


**Example: basicSearch**

Search for 'API' across all documents

```json
{
  "items": [
    {
      "documentId": "doc-123",
      "markdown": "The **API** endpoints are documented...",
      "blockIds": [
        "block-abc-123",
        "block-def-456"
      ]
    },
    {
      "documentId": "doc-456",
      "markdown": "**API** authentication requires...",
      "blockIds": [
        "block-ghi-789"
      ]
    }
  ]
}
```

**Example: filteredSearch**

Search with document filtering

```json
{
  "items": [
    {
      "documentId": "doc-123",
      "markdown": "Authentication **token** is required...",
      "blockIds": [
        "block-jkl-012"
      ]
    }
  ]
}
```

**Example: withMatchedBlocks**

Search with fetchBlocks=true

```json
{
  "items": [
    {
      "documentId": "doc-123",
      "markdown": "The **API** endpoints are documented...",
      "blockIds": [
        "block-abc-123"
      ],
      "blocks": [
        {
          "id": "block-abc-123",
          "type": "text",
          "markdown": "The API endpoints are documented in the developer guide"
        }
      ]
    }
  ]
}
```

---

## List Collections

`GET /collections`

List all collections across documents in this multi-document connection

### Parameters

- **documentIds** (query): string
  The document IDs to filter. If not provided, collections in all documents will be listed. Can be a single string or array of strings.
- **documentFilterMode** (query): string
  Whether to include or exclude the specified documents. Default is 'include'. Only used when documentIds is provided.

### Responses

#### 200
Success

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "col1",
      "name": "Tasks",
      "itemCount": 5,
      "documentId": "doc1"
    },
    {
      "id": "col2",
      "name": "Notes",
      "itemCount": 3,
      "documentId": "doc2"
    }
  ]
}
```

---

## Create Collection

`POST /collections`

Create a new collection (structured table) in a document within this multi-document connection. Define the schema with columns and their types. This is an experimental endpoint, expect breaking changes.

### Request Body

**Content-Type:** `application/json`

```json
{
  "schema": {
    "name": "Tasks",
    "contentPropDetails": {
      "name": "Title"
    },
    "properties": [
      {
        "name": "Status",
        "type": "singleSelect",
        "options": [
          {
            "name": "Not Started"
          },
          {
            "name": "In Progress"
          },
          {
            "name": "Completed"
          }
        ]
      },
      {
        "name": "Priority",
        "type": "singleSelect",
        "options": [
          {
            "name": "Low"
          },
          {
            "name": "Medium"
          },
          {
            "name": "High"
          }
        ]
      },
      {
        "name": "Due Date",
        "type": "date"
      }
    ]
  },
  "position": {
    "position": "end"
  }
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "collectionBlockId": "abc123",
  "name": "Tasks",
  "schema": {
    "name": "Tasks",
    "contentPropDetails": {
      "key": "title",
      "name": "Title"
    },
    "properties": [
      {
        "key": "status",
        "name": "Status",
        "type": "singleSelect",
        "options": [
          {
            "name": "Not Started",
            "color": "yellow"
          },
          {
            "name": "In Progress",
            "color": "sky-blue"
          },
          {
            "name": "Completed",
            "color": "mint-green"
          }
        ]
      },
      {
        "key": "priority",
        "name": "Priority",
        "type": "singleSelect",
        "options": [
          {
            "name": "Low",
            "color": "gray"
          },
          {
            "name": "Medium",
            "color": "yellow"
          },
          {
            "name": "High",
            "color": "red"
          }
        ]
      },
      {
        "key": "dueDate",
        "name": "Due Date",
        "type": "date"
      }
    ]
  }
}
```

---

## List Documents

`GET /documents`

Retrieve all documents accessible through this multi-document connection. Returns rootBlockIds, titles, and deletion status. Use the rootBlockId with GET /blocks to fetch content.

### Parameters

- **fetchMetadata** (query): boolean
  Whether to include metadata (lastModifiedAt, createdAt) in the response. Default is false.

### Responses

#### 200
Success

**Content-Type:** `application/json`


**Example: basic**

List of documents with deletion status

```json
{
  "items": [
    {
      "id": "doc-123",
      "title": "Project Plan",
      "isDeleted": false
    },
    {
      "id": "doc-456",
      "title": "Meeting Notes",
      "isDeleted": false
    },
    {
      "id": "doc-789",
      "title": "[Deleted Document]",
      "isDeleted": true
    }
  ]
}
```

**Example: withMetadata**

List with metadata (fetchMetadata=true)

```json
{
  "items": [
    {
      "id": "doc-123",
      "title": "Project Plan",
      "isDeleted": false,
      "lastModifiedAt": "2025-01-15T14:30:00Z",
      "createdAt": "2025-01-10T09:00:00Z",
      "clickableLink": "craftdocs://open?spaceId=space-uuid&documentId=doc-uuid-123"
    }
  ]
}
```

---

## Get Collection Schema

`GET /collections/{collectionId}/schema`

Get collection schema in JSON Schema format

### Parameters

- **format** (query): string
  The format to return the schema in. Default: json-schema-items. - 'schema': Returns the collection schema structure that can be edited - 'json-schema-items': Returns JSON Schema for addCollectionItems/updateCollectionItems validation
- **collectionId** (required) (path): string

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`


**Example: schemaFormat**

Schema format response

```json
{
  "key": "tasks",
  "name": "Tasks",
  "contentPropDetails": {
    "key": "title",
    "name": "Title"
  },
  "properties": [
    {
      "key": "status",
      "name": "Status",
      "type": "select",
      "options": [
        "Not Started",
        "In Progress",
        "Completed"
      ]
    },
    {
      "key": "priority",
      "name": "Priority",
      "type": "select",
      "options": [
        "Low",
        "Medium",
        "High"
      ]
    },
    {
      "key": "dueDate",
      "name": "Due Date",
      "type": "date"
    }
  ],
  "propertyDetails": [
    {
      "key": "status",
      "name": "Status",
      "type": "select",
      "options": [
        "Not Started",
        "In Progress",
        "Completed"
      ]
    },
    {
      "key": "priority",
      "name": "Priority",
      "type": "select",
      "options": [
        "Low",
        "Medium",
        "High"
      ]
    },
    {
      "key": "dueDate",
      "name": "Due Date",
      "type": "date"
    }
  ]
}
```

**Example: jsonSchemaFormat**

JSON Schema format (for validation)

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "The title of the collection item"
          },
          "properties": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "enum": [
                  "Not Started",
                  "In Progress",
                  "Completed"
                ],
                "description": "Status"
              },
              "priority": {
                "type": "string",
                "enum": [
                  "Low",
                  "Medium",
                  "High"
                ],
                "description": "Priority"
              },
              "dueDate": {
                "type": "string",
                "description": "Due Date"
              }
            }
          }
        },
        "required": [
          "title"
        ]
      }
    }
  },
  "required": [
    "items"
  ],
  "additionalProperties": false
}
```

---

## Update Collection Schema

`PUT /collections/{collectionId}/schema`

Update the collection schema. Replaces the existing schema entirely - include all fields you want to keep. Keep property keys stable for existing properties. This is an experimental endpoint, expect breaking changes.

### Parameters

- **collectionId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "schema": {
    "name": "Tasks",
    "contentPropDetails": {
      "name": "Title"
    },
    "properties": [
      {
        "key": "status",
        "name": "Status",
        "type": "singleSelect",
        "options": [
          {
            "name": "Not Started"
          },
          {
            "name": "In Progress"
          },
          {
            "name": "Completed"
          },
          {
            "name": "Blocked"
          }
        ]
      },
      {
        "key": "priority",
        "name": "Priority",
        "type": "singleSelect",
        "options": [
          {
            "name": "Low"
          },
          {
            "name": "Medium"
          },
          {
            "name": "High"
          }
        ]
      },
      {
        "key": "dueDate",
        "name": "Due Date",
        "type": "date"
      },
      {
        "name": "Assignee",
        "type": "text"
      }
    ]
  }
}
```

### Responses

#### 200
Successfully updated resource

**Content-Type:** `application/json`

```json
{
  "collectionBlockId": "abc123",
  "schema": {
    "name": "Tasks",
    "contentPropDetails": {
      "key": "title",
      "name": "Title"
    },
    "properties": [
      {
        "key": "status",
        "name": "Status",
        "type": "singleSelect",
        "options": [
          {
            "name": "Not Started",
            "color": "yellow"
          },
          {
            "name": "In Progress",
            "color": "sky-blue"
          },
          {
            "name": "Completed",
            "color": "mint-green"
          },
          {
            "name": "Blocked",
            "color": "red"
          }
        ]
      },
      {
        "key": "priority",
        "name": "Priority",
        "type": "singleSelect",
        "options": [
          {
            "name": "Low",
            "color": "gray"
          },
          {
            "name": "Medium",
            "color": "yellow"
          },
          {
            "name": "High",
            "color": "red"
          }
        ]
      },
      {
        "key": "dueDate",
        "name": "Due Date",
        "type": "date"
      },
      {
        "key": "assignee",
        "name": "Assignee",
        "type": "text"
      }
    ]
  }
}
```

---

## Get Collection Items

`GET /collections/{collectionId}/items`

Get all items from a collection

### Parameters

- **maxDepth** (query): number
  The maximum depth of nested content to fetch for each collection item. Default is -1 (all descendants). With a depth of 0, only the item properties are fetched without nested content.
- **collectionId** (required) (path): string

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "item1",
      "title": "Task 1",
      "properties": {
        "status": "In Progress",
        "priority": "High",
        "assignee": "John Doe"
      },
      "content": [
        {
          "id": "1",
          "type": "text",
          "markdown": "Detailed description of the task."
        }
      ]
    },
    {
      "id": "item2",
      "title": "Task 2",
      "properties": {
        "status": "Done",
        "priority": "Low",
        "assignee": "Jane Smith"
      }
    }
  ]
}
```

---

## Add Collection Items

`POST /collections/{collectionId}/items`

Add new items to a collection. Two-way relations are synced automatically in the background - only set one side for consistency.

### Parameters

- **collectionId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "title": "Cross-doc Task",
      "properties": {
        "status": "Todo",
        "priority": "High"
      }
    }
  ]
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "item3",
      "title": "New Task",
      "properties": {
        "status": "Todo",
        "priority": "Medium"
      }
    }
  ]
}
```

---

## Delete Collection Items

`DELETE /collections/{collectionId}/items`

Delete collection items (also deletes content inside items)

### Parameters

- **collectionId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "idsToDelete": [
    "item1",
    "item2",
    "item3"
  ]
}
```

### Responses

#### 200
Successfully deleted resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "item1"
    },
    {
      "id": "item2"
    },
    {
      "id": "item3"
    }
  ]
}
```

---

## Update Collection Items

`PUT /collections/{collectionId}/items`

Update collection items. Two-way relations are synced automatically in the background - only set one side for consistency.

### Parameters

- **collectionId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "itemsToUpdate": [
    {
      "id": "item1",
      "properties": {
        "status": "In Progress"
      }
    }
  ]
}
```

### Responses

#### 200
Successfully updated resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "item1",
      "title": "Updated Task",
      "properties": {
        "status": "Done",
        "priority": "High"
      }
    }
  ]
}
```

---

## Upload File

`POST /upload`

Upload a file (image, video, or document) and insert it at the specified position. Requires explicit target (pageId or siblingId). Send raw binary data in request body with Content-Type header.

### Parameters

- **position** (required) (query): string
  Where to insert: 'start' or 'end' for page/date positions, 'before' or 'after' for sibling positions.
- **pageId** (query): string
  Page block ID to insert into. Required when position is 'start' or 'end' (unless date is specified).
- **date** (query): string
  Daily note date. Accepts 'today', 'yesterday', 'tomorrow', or ISO date (YYYY-MM-DD). Use with position 'start' or 'end'.
- **siblingId** (query): string
  Block ID to insert relative to. Required when position is 'before' or 'after'.

### Request Body

**Content-Type:** `application/octet-stream`

```text
string
```

### Responses

#### 200
Success

**Content-Type:** `application/json`

```json
{
  "blockId": "string",
  "assetUrl": "string"
}
```

---

## Add comments

`POST /comments`

Add comments to blocks. This is an experimental endpoint, expect breaking changes.

### Request Body

**Content-Type:** `application/json`

```json
{
  "comments": [
    {
      "blockId": "abc123",
      "content": "This is a comment."
    }
  ]
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "commentId": "abc123-def456"
    }
  ]
}
```

---

## Get Connection Info

`GET /connection`

Returns connection metadata including space ID, space name, timezone, current time, and URL templates for constructing deep links to blocks.

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`

```json
{
  "space": {
    "id": "string",
    "name": "string",
    "timezone": "string",
    "time": "string",
    "friendlyDate": "string"
  },
  "utc": {
    "time": "string"
  },
  "urlTemplates": {
    "app": "string"
  }
}
```

---

## Create Whiteboard

`POST /whiteboards`

Create a new empty whiteboard block at the specified position. Returns the whiteboard block ID. Use whiteboardElements_add to populate it. This is an experimental API, expect breaking changes.

### Request Body

**Content-Type:** `application/json`

```json
{
  "position": {
    "position": "start",
    "pageId": "string"
  }
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "whiteboardBlockId": "string"
}
```

---

## Get Whiteboard Elements

`GET /whiteboards/{whiteboardBlockId}/elements`

Get all Excalidraw elements and appState from a whiteboard block. This is an experimental API, expect breaking changes.

### Parameters

- **whiteboardBlockId** (required) (path): string

### Responses

#### 200
Successfully retrieved data

**Content-Type:** `application/json`

```json
{
  "elements": [
    {
      "id": "string",
      "type": "string",
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "text": "string",
      "points": [
        [
          0
        ]
      ],
      "additionalProp": "<any>"
    }
  ],
  "assets": {
    "additionalProp": "<any>"
  },
  "appState": {
    "additionalProp": "<any>"
  }
}
```

---

## Add Whiteboard Elements

`POST /whiteboards/{whiteboardBlockId}/elements`

Append elements to an existing whiteboard without removing existing ones. This is an experimental API, expect breaking changes.

### Parameters

- **whiteboardBlockId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "elements": [
    {
      "id": "string",
      "type": "string",
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "text": "string",
      "points": [
        [
          0
        ]
      ],
      "additionalProp": "<any>"
    }
  ]
}
```

### Responses

#### 200
Successfully created resource

**Content-Type:** `application/json`

```json
{
  "elements": [
    {
      "id": "string",
      "type": "string",
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "text": "string",
      "points": [
        [
          0
        ]
      ],
      "additionalProp": "<any>"
    }
  ],
  "assets": {
    "additionalProp": "<any>"
  },
  "appState": {
    "additionalProp": "<any>"
  }
}
```

---

## Delete Whiteboard Elements

`DELETE /whiteboards/{whiteboardBlockId}/elements`

Remove elements from a whiteboard by their Excalidraw element IDs. This is an experimental API, expect breaking changes.

### Parameters

- **whiteboardBlockId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "elementIds": [
    "string"
  ]
}
```

### Responses

#### 200
Successfully deleted resource

**Content-Type:** `application/json`

```json
{
  "deletedCount": 0,
  "remainingCount": 0
}
```

---

## Update Whiteboard Elements

`PUT /whiteboards/{whiteboardBlockId}/elements`

Update specific elements in a whiteboard by their ID. Elements not included in the request remain unchanged. This is an experimental API, expect breaking changes.

### Parameters

- **whiteboardBlockId** (required) (path): string

### Request Body

**Content-Type:** `application/json`

```json
{
  "elements": [
    {
      "id": "string",
      "type": "string",
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "text": "string",
      "points": [
        [
          0
        ]
      ],
      "additionalProp": "<any>"
    }
  ]
}
```

### Responses

#### 200
Successfully updated resource

**Content-Type:** `application/json`

```json
{
  "elements": [
    {
      "id": "string",
      "type": "string",
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "text": "string",
      "points": [
        [
          0
        ]
      ],
      "additionalProp": "<any>"
    }
  ],
  "assets": {
    "additionalProp": "<any>"
  },
  "appState": {
    "additionalProp": "<any>"
  }
}
```

---
