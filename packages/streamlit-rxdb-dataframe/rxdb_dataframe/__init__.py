import os
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

# from streamlit.connections import ExperimentalBaseConnection
# from jsonschema import validate, TypeChecker
from streamlit.runtime.caching import cache_data
from typing import Any, Optional, Dict, Union, List, Callable

default_db_config = {
    "name": "streamlit-rxdb",
    "options": {"storageType": "dexie"},
    "multiInstance": False,
    "ignoreDuplicate": True,
}


# https://experimental-connection.streamlit.app/Build_your_own


class RxJsonSchema:
    def __init__(
        self,
        version: int,
        primaryKey: Any,
        type: Union["object", str],
        properties: Dict[str, Dict[str, Any]],
        required: Optional[List[str]] = None,
        indexes: Optional[List[Union[str, List[str]]]] = None,
        internalIndexes: Optional[List[List[str]]] = None,
        encrypted: Optional[List[str]] = None,
        keyCompression: Optional[bool] = None,
        additionalProperties: Optional[bool] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        # sharding: Optional[Sharding] = None,
        # attachments: Optional[Dict[str, Any]] = None,
        # crdt: Optional["CRDTSchemaOptions"] = None,
    ):
        self.title = title
        self.description = description
        self.version = version
        self.primaryKey = primaryKey
        self.type = type
        self.properties = properties
        self.required = required
        self.indexes = indexes
        self.internalIndexes = internalIndexes
        self.encrypted = encrypted
        self.keyCompression = keyCompression
        self.additionalProperties = additionalProperties
        # self.attachments = attachments
        # self.sharding = sharding
        # self.crdt = crdt


class RxCollectionCreator:
    def __init__(
        self,
        schema: RxJsonSchema,
        instanceCreationOptions: Optional[Any] = None,
        # migrationStrategies: Optional['MigrationStrategies'] = None,
        autoMigrate: Optional[bool] = None,
        # statics: Optional[Dict[str, 'Function']] = None,
        # methods: Optional[Dict[str, 'Function']] = None,
        attachments: Optional[Dict[str, Callable]] = None,
        options: Optional[Any] = None,
        localDocuments: Optional[bool] = None,
        # cacheReplacementPolicy: Optional['RxCacheReplacementPolicy'] = None,
        # conflictHandler: Optional['RxConflictHandler'] = None
    ):
        self.schema = schema
        self.instanceCreationOptions = instanceCreationOptions
        # self.migrationStrategies = migrationStrategies
        self.autoMigrate = autoMigrate
        # self.statics = statics
        # self.methods = methods
        self.attachments = attachments
        self.options = options
        self.localDocuments = localDocuments
        # self.cacheReplacementPolicy = cacheReplacementPolicy
        # self.conflictHandler = conflictHandler


class MangoQuery:
    def __init__(
        self,
        selector: Dict[str, Any],
        sort: Optional[List[Dict[str, str]]] = None,
        limit: Optional[int] = None,
        skip: Optional[int] = None,
    ):
        self.selector = selector
        self.sort = sort
        self.limit = limit
        self.skip = skip


# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = True

if not _RELEASE: # NOSONAR
    _rxdb_dataframe = components.declare_component(
        "rxdb_dataframe",
        url="http://localhost:4201",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    index_js_path = os.path.join(build_dir, "index.js")

    if os.path.exists(index_js_path):
        print("index.js exists")
    else:
        print("index.js does not exist")

    _rxdb_dataframe = components.declare_component("rxdb_dataframe", path=build_dir)


@cache_data
def get_dataframe_by_schema(schema: dict):
    df = pd.DataFrame()
    properties = schema["properties"]
    for column, prop in properties.items():
        if prop["type"] == "string" and prop.get("format") == "date-time":
            df[column] = pd.Series(dtype="datetime64[ns]")
        elif prop["type"] == "string":
            df[column] = pd.Series(dtype="object")
        elif prop["type"] == "boolean":
            df[column] = pd.Series(dtype="bool")
        elif prop["type"] == "object":
            df[column] = pd.Series(dtype="category")
        elif prop.get("enum") and len(prop["enum"]) > 0:
            df[column] = pd.Series(dtype="category")
        elif prop["type"] == "integer" and prop.get("format") == "time":
            df[column] = pd.Timestamp.now()
        elif prop["type"] == "integer":
            df[column] = pd.Series(dtype="int")
        elif prop["type"] == "number":
            df[column] = pd.Series(dtype="float")
    return df


@cache_data
def get_column_config(schema: dict):
    """
    Generates a column configuration dictionary based on the given schema.

    Args:
      schema (dict): The schema dictionary containing the properties

    Returns:
      dict: The column configuration dictionary.

    INFO: https://docs.streamlit.io/library/api-reference/data/st.column_config/st.column_config.textcolumn
    """
    properties = schema["properties"]
    column_config = {}
    for column, prop in properties.items():
        if prop["type"] == "string" and prop.get("format") == "date-time":
            column_config[column] = st.column_config.DatetimeColumn(
                format="YYYY-MM-DD HH:mm",
            )
        elif prop["type"] == "string":
            column_config[column] = st.column_config.TextColumn(
                max_chars=prop.get("maxLength")
            )
        elif prop["type"] == "boolean":
            column_config[column] = st.column_config.CheckboxColumn()
        elif prop["type"] == "object":
            column_config[column] = st.column_config.Column()
        elif prop.get("enum") and len(prop["enum"]) > 0:
            column_config[column] = st.column_config.SelectboxColumn(
                options=prop["enum"]
            )
        # elif prop['type'] == 'integer' and prop.get('format') == 'time':
        #     column_config[column] = st.column_config.DatetimeColumn(step=1)
        elif prop["type"] == "integer":
            # st.column_config.DatetimeColumn() # FIXME: try to make it time
            column_config[column] = st.column_config.NumberColumn(
                max_value=prop.get("max"),
                min_value=prop.get("min"),
                step=prop.get("multipleOf"),
            )
        elif prop["type"] == "number":
            st.column_config.NumberColumn(
                max_value=prop.get("max"), min_value=prop.get("min")
            )
        column_config[column]["label"] = prop.get("title")
        column_config[column]["help"] = prop.get("description")
        column_config[column]["disabled"] = prop.get("readOnly")
        column_config[column]["required"] = column in schema.get("required", [])

    return column_config


def reset_editing_state(collection_name):
    if collection_name in st.session_state:
        print("resetting editing state")
        # st.session_state[collection_name].clear()
        # st.session_state[collection_name].get("added_rows", []).clear()
        # st.session_state[collection_name].get("deleted_rows", []).clear()


def rxdb_dataframe(
    collection_config,
    db_config: RxCollectionCreator = default_db_config,
    dataframe: pd.DataFrame = pd.DataFrame(),
    query: MangoQuery = None,
    with_rev: Optional[bool] = False,
    key: str = None,
) -> List[Dict[str, Any]]:
    if key is None:
        key = collection_config["name"]
    if key not in st.session_state:
        print("resetting editing state")
        # reset_editing_state(key)

    result = _rxdb_dataframe(
        collection_config=collection_config,
        db_config=db_config,
        dataframe=dataframe.copy(),
        data=dataframe.to_json(),
        query=query,
        with_rev=with_rev,
        key=(key + "_rxdb"),
        editing_state=st.session_state.get(key, {}),
    )
    # print(result)
    return result


__title__ = "RxDB Dataframe"
__desc__ = "Make Dataframe from [RxDB](https://rxdb.info/) collection"
__icon__ = "🏦"
# __examples__ = [example]
__author__ = "voznik"
__streamlit_cloud_url__ = "https://st-rxdb-dataframe.streamlitapp.com/"
__github_repo__ = "voznik/ngx-odm"
