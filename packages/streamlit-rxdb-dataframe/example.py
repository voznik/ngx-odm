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
# operators = ["$eq", "$gt", "$gte", "$lt", "$lte", "$ne"]


def on_change_dataframe(rxdb_state: RxDBSessionState):
    print("RxDBDataframe component on_change call")
    print("collection.info()", rxdb_state.info)
    print("dataframe.head()", rxdb_state.dataframe.head())


@cache_data
def apply_row_style(row):
    return (
        ["color:green"] * len(row) if row.completed else ["color:grey"] * len(row)  # default color
    )  # noqa: E501


query = state.query
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
    st.data_editor(
        df.style.apply(apply_row_style, axis=1),
        use_container_width=True,
        hide_index=True,
        column_config=state.column_config,
        column_order=["title", "completed", "createdAt"],
        num_rows="dynamic",
        key=RXDB_COLLECTION_EDITOR_KEY,
    )
elif display == "dataframe":
    st.dataframe(
        df.style.apply(apply_row_style, axis=1),
        use_container_width=True,
        hide_index=True,
        column_config=state.column_config,
        column_order=["title", "completed", "createdAt"],
    )
else:
    st.table(
        df.style.apply(apply_row_style, axis=1),
    )


with st.sidebar:
    st.write("RxDB Collection Config")
    st.json(collection_config, expanded=False)

    st.write("RsDB Session State:")
    st.json(st.session_state, expanded=False)
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
