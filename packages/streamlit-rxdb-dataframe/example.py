import json
import os
from typing import Dict, List
import streamlit as st
from streamlit.runtime.caching import cache_data
from rxdb_dataframe import (
    RXDB_COLLECTION_EDITOR_KEY,
    RxCollectionCreator,
    RxDBSessionState,
    rxdb_dataframe,
)

# from pandas.api.types import ( is_bool_dtype, is_categorical_dtype, is_datetime64_any_dtype, is_numeric_dtype, is_object_dtype, )  # noqa: E501

current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, "rxdb_dataframe/frontend/public/assets/data")

collection_name = "todo"
todoSchema: Dict = json.load(open(os.path.join(data_dir, "todo.schema.json")))
initial_docs: List = json.load(open(os.path.join(data_dir, "col.dump.json")))["docs"]
collection_config: RxCollectionCreator = {
    "name": collection_name,
    "schema": todoSchema,  # to auto load schema from remote url pass None
    "localDocuments": True,
    "options": {
        # 'schemaUrl': 'assets/data/todo.schema.json',
        "initialDocs": initial_docs,
        "recreate": False,
    },
}


state = RxDBSessionState()
column_config = state.column_config
query = state.query


def on_change_dataframe(rxdb_state: RxDBSessionState):
    print("RxDBDataframe component on_change call")
    print("collection.info()", rxdb_state.info)


@cache_data
def apply_row_style(row):
    return (
        ["color:green"] * len(row) if row.completed else ["color:grey"] * len(row)  # default color
    )  # noqa: E501


display = st.radio(
    "Display RxDB collection as:",
    options=["dataframe", "data_editor", "table"],
    horizontal=True,
)
filter = st.radio(
    label="Filter data using RxDB **RxQuery**",
    help="MangoQuery syntax",
    label_visibility="visible",
    options=["all", "active", "completed"],
    horizontal=True,
)

if filter == "active":
    query = {"selector": {"completed": {"$eq": False}}}
elif filter == "completed":
    query = {"selector": {"completed": {"$eq": True}}}
else:
    query = {"selector": {}}

df = rxdb_dataframe(
    collection_config,
    query=query,
    with_rev=False,
    on_change=on_change_dataframe,
)

if display == "data_editor":
    try:
        st.data_editor(
            df.copy().style.apply(apply_row_style, axis=1),
            use_container_width=True,
            hide_index=True,
            column_config=column_config,
            column_order=["title", "completed", "createdAt"],
            num_rows="dynamic",
            key=RXDB_COLLECTION_EDITOR_KEY,
        )
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")
elif display == "dataframe":
    try:
        st.dataframe(
            df.style.apply(apply_row_style, axis=1),
            use_container_width=True,
            hide_index=True,
            column_config=column_config,
            column_order=["title", "completed", "createdAt"],
        )
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")
else:
    try:
        st.table(
            df.style.apply(apply_row_style, axis=1),
        )
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")


with st.sidebar:
    st.write("RxDB Collection Config")
    st.json(collection_config, expanded=False)

    st.write("RsDB Session State:")
    st.json(st.session_state, expanded=False)
