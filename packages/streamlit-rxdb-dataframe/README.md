# streamlit-rxdb-dataframe

Custom `streamlit` component connecting local browser `indexedDB` database as `RxDB` collection as `dataframe`

## Demo

[demo](https://st-rxdb-dataframe.streamlit.app/) - based on TodoMVC

![Example Screencast](https://github.com/voznik/ngx-odm/blob/master/packages/streamlit-rxdb-dataframe/screencast.gif?raw=true)

## Usage

### Provide JSONSchema

<details>
<summary>JSONSchema</summary>

```json
{
  "definitions": {},
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Todo",
  "description": "Todo Schema",
  "required": ["id", "title", "createdAt"],
  "version": 0,
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id",
      "pattern": "^(.*)$",
      "maxLength": 36,
      "readOnly": true
    },
    "title": {
      "type": "string",
      "title": "Title",
      "minLength": 3
    },
    "completed": {
      "type": "boolean",
      "title": "Done"
    },
    "createdAt": {
      "type": "string",
      "title": "Created Date",
      "format": "date-time",
      "readOnly": true
    },
    "last_modified": {
      "type": "integer",
      "format": "time",
      "title": "Last Modified Date"
    }
  },
  "__indexes": ["createdAt"],
  "primaryKey": "id",
  "attachments": {
    "encrypted": false
  }
}
```

</details>

### Provide Collection Config and use streamlit dataframe, data_editor or table

```python

todoSchema: Dict = json.load(open(os.path.join(data_dir, "todo.schema.json")))
# initial_docs: List = json.load(open(os.path.join(data_dir, "col.dump.json")))["docs"]
collection_config = {
    "name": "todo",
    "schema": todoSchema,  # to auto load schema from remote url pass None
    "localDocuments": True,
    "options": {
        # 'schemaUrl': 'assets/data/todo.schema.json',
        # "initialDocs": initial_docs,
    },
}

def on_change_dataframe(rxdb_state: RxDBSessionState):
    print("RxDBDataframe component on_change call")
    print("collection.info()", rxdb_state.info)
    print("dataframe.head()", rxdb_state.dataframe.head())

df = rxdb_dataframe(
    collection_config,
    query=None,
    with_rev=False,
    on_change=on_change_dataframe,
)
st.dataframe(
    df,
    use_container_width=True,
    hide_index=True,
    column_config=st.session_state["rxdb"]["column_config"],
    column_order=["title", "completed", "createdAt"],
)
```

## Run & Build

### Run

```bash
cd packages/streamlit-rxdb-dataframe/
poetry run streamlit run example.py
```

### Build

```bash
poetry build -o ../../dist/packages/streamlit-rxdb-dataframe
```

### Publish

```bash
poetry publish -r test-pypi --dist-dir ../../dist/packages/streamlit-rx
db-dataframe
```

<!--
# TODO: Add form to construct RxQuery
    # query_container = st.container()
    # with query_container:
    #     to_filter_columns = st.multiselect(
    #         "Filter dataframe on",
    #         df.columns,
    #         key=f"{prefix}_multiselect",
    #     )
    #     filters: Dict[str, Any] = dict()
    #     for column in to_filter_columns:
    #         left, right = st.columns((1, 20))
    #         # Treat columns with < 10 unique values as categorical
    #         if is_categorical_dtype(df[column]) or df[column].nunique() < 10:
    #             left.write("↳")
    #             filters[column] = right.multiselect(
    #                 f"Values for {column}",
    #                 df[column].unique(),
    #                 default=list(df[column].unique()),
    #                 key=f"{prefix}_{column}",
    #             )
    #             df = df[df[column].isin(filters[column])]
    #         elif is_numeric_dtype(df[column]):
    #             left.write("↳")
    #             _min = float(df[column].min())
    #             _max = float(df[column].max())
    #             step = (_max - _min) / 100
    #             filters[column] = right.slider(
    #                 f"Values for {column}",
    #                 _min,
    #                 _max,
    #                 (_min, _max),
    #                 step=step,
    #                 key=f"{prefix}_{column}",
    #             )
    #             df = df[df[column].between(*filters[column])]
    #         elif is_datetime64_any_dtype(df[column]):
    #             left.write("↳")
    #             filters[column] = right.date_input(
    #                 f"Values for {column}",
    #                 value=(
    #                     df[column].min(),
    #                     df[column].max(),
    #                 ),
    #                 key=f"{prefix}_{column}",
    #             )
    #             if len(filters[column]) == 2:
    #                 filters[column] = tuple(map(pd.to_datetime, filters[column]))  # noqa: E501
    #                 start_date, end_date = filters[column]
    #                 df = df.loc[df[column].between(start_date, end_date)]
    #         else:
    #             left.write("↳")
    #             filters[column] = right.text_input(
    #                 f"Pattern in {column}",
    #                 key=f"{prefix}_{column}",
    #             )
    #             if filters[column]:
    #                 print(filters[column])
 -->
