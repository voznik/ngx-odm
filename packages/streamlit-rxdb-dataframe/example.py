import streamlit as st
from rxdb_dataframe import (
    RxCollectionCreator,
    RxJsonSchema,
    get_dataframe_by_schema,
    reset_editing_state,
    rxdb_dataframe,
    get_column_config,
)
import datetime

# from jsonschema import validate, TypeChecker

collection_name = "todo"
todoSchema: RxJsonSchema = {
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
            "readOnly": True,
        },
        "title": {
            "type": "string",
            "title": "Title",
            "minLength": 3,
        },
        "completed": {"type": "boolean", "title": "Done"},
        "createdAt": {
            "type": "string",
            "title": "Created Date",
            "format": "date-time",
            "readOnly": True,
        },
        "last_modified": {
            "type": "integer",
            "format": "time",
            "title": "Last Modified Date",
            "description": "Last modified date in milliseconds, "
            + "automatically updated by database",
            "multipleOf": 1,
        },
    },
    "primaryKey": "id",
    "attachments": {"encrypted": False},
}

initial_docs = [
    {
        "id": "ac3ef2c6-c98b-43e1-9047-71d68b1f92f4",
        "title": "Python Todo list example",
        "completed": True,
        "createdAt": datetime.datetime.fromtimestamp(1546300800).isoformat(),
        "last_modified": 1546300800000,
    },
    {
        "id": "a4c6a479-7cca-4d3b-ab90-45d3eaa957f3",
        "title": "Python example 2",
        "completed": False,
        "createdAt": datetime.datetime.fromtimestamp(1548979200).isoformat(),
        "last_modified": 1548979200000,
    },
    {
        "id": "a4c6a479-7cca-4d3b-bc10-45d3eaa957r5",
        "title": 'Use "@ngx-odm/rxdb" in your project',
        "completed": False,
        "createdAt": datetime.datetime.now().isoformat(),
        "last_modified": int(
            datetime.datetime.now().timestamp() * 1000
        ),  # in milliseconds
    },
]

# Test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run rxdb_dataframe/example.py`
collection_config: RxCollectionCreator = {
    "name": collection_name,
    "schema": todoSchema,  # to load schema from remote url pass None
    "localDocuments": True,
    "options": {
        # 'schemaUrl': 'assets/data/todo.schema.json',
        "initialDocs": initial_docs,
        "recreate": True,
    },
}

df = get_dataframe_by_schema(todoSchema)
column_config = get_column_config(todoSchema)
data = rxdb_dataframe(collection_config, dataframe=df)


def on_change():
    """
    Called after RxDB Dataframe component applies changes
    """
    st.success("on_change")
    reset_editing_state(collection_name)


st.data_editor(
    data,
    key=collection_name,
    num_rows="dynamic",
    use_container_width=True,
    column_config=column_config,
    column_order=["title", "completed", "createdAt"],
    on_change=on_change,
)
st.sidebar.json(st.session_state.to_dict())
