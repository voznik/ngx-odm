import os
from typing import Any, Callable, Dict, List, Optional, Union

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
from streamlit import session_state as ss
from streamlit.elements.lib.column_config_utils import (
    ColumnConfig,
    ColumnConfigMappingInput as ColumnConfigMap,
    ColumnDataKind,
)
from streamlit.runtime.caching import cache_data


class RxJsonSchema:
    def __init__(
        self,
        version: int,
        primaryKey: Any,
        type: Union["object", str],
        properties: Dict[str, Dict[str, Any]],
        required: Optional[List[str]] = None,
        indexes: Optional[List[Union[str, List[str]]]] = None,  # noqa: TAE002
        internalIndexes: Optional[List[List[str]]] = None,  # noqa: TAE002
        encrypted: Optional[List[str]] = None,
        keyCompression: Optional[bool] = None,
        additionalProperties: Optional[bool] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
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
        # self.crdt = crdt


class RxCollectionCreator:
    def __init__(
        self,
        schema: RxJsonSchema,
        instanceCreationOptions: Optional[Any] = None,
        autoMigrate: Optional[bool] = None,
        attachments: Optional[Dict[str, Callable]] = None,
        options: Optional[Any] = None,
        localDocuments: Optional[bool] = None,
        # migrationStrategies: Optional['MigrationStrategies'] = None,
        # cacheReplacementPolicy: Optional['RxCacheReplacementPolicy'] = None,
        # conflictHandler: Optional['RxConflictHandler'] = None
    ):
        self.schema = schema
        self.instanceCreationOptions = instanceCreationOptions
        self.autoMigrate = autoMigrate
        self.attachments = attachments
        self.options = options
        self.localDocuments = localDocuments
        # self.migrationStrategies = migrationStrategies
        # self.cacheReplacementPolicy = cacheReplacementPolicy
        # self.conflictHandler = conflictHandler


class RxDBSessionState:
    """
    Represents the `session_state` wrapper object for RxDBDataframe component
    """

    def __init__(self):
        if RXDB_STATE_KEY not in ss:
            ss[RXDB_STATE_KEY] = {
                "info": {},  # collection info
                "with_rev": False,  # include revision in the result
                "query": {"selector": {}, "sort": []},  # collection query
                "dataframe": None,  #
                "column_config": None,  # ColumnConfig
                "docs": [],  # collection documents
            }
        if RXDB_COLLECTION_EDITOR_KEY not in st.session_state:
            pass
            ss[RXDB_COLLECTION_EDITOR_KEY] = {}

    def __getattr__(self, key):
        if key not in ss[RXDB_STATE_KEY]:
            ss[RXDB_STATE_KEY][key] = {}
        return ss[RXDB_STATE_KEY][key]

    def __getitem__(self, key):
        if key not in ss[RXDB_STATE_KEY]:
            ss[RXDB_STATE_KEY][key] = {}
        return ss[RXDB_STATE_KEY][key]

    def __setattr__(self, key, value):
        ss[RXDB_STATE_KEY][key] = value

    def __setitem__(self, key, value):
        ss[RXDB_STATE_KEY][key] = value


# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = True

if not _RELEASE:  # NOSONAR
    _rxdb_dataframe = components.declare_component(
        "rxdb_dataframe",
        url="http://localhost:4201",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    dist = os.path.join(parent_dir, "frontend/build")
    index_js_path = os.path.join(dist, "index.js")

    if os.path.exists(index_js_path):
        print("index.js exists")
    else:
        print("index.js does not exist")

    _rxdb_dataframe = components.declare_component("rxdb_dataframe", path=dist)


RXDB_STATE_KEY = "rxdb"
RXDB_COLLECTION_KEY = "rxdb_collection"
RXDB_COLLECTION_EDITOR_KEY = "rxdb_collection_editor"
DEFAULT_DB_CONFIG = {
    "name": "streamlit-rxdb",
    "options": {"storageType": "dexie"},
    "multiInstance": False,
    "ignoreDuplicate": True,
}


@cache_data
def get_dataframe_by_schema(schema: dict) -> pd:
    """
    Create a `pandas.DataFrame` based on the given JSONSchema.
    """
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
            df[column] = pd.Series(dtype="int")  # pd.Timestamp.now()
        elif prop["type"] == "integer":
            df[column] = pd.Series(dtype="int")
        elif prop["type"] == "number":
            df[column] = pd.Series(dtype="float")
    return df


@cache_data
def get_column_config(schema: dict) -> ColumnConfigMap:
    """
    Generates a column configuration dictionary based on the given schema.

    INFO: https://docs.streamlit.io/library/api-reference/data/st.column_config
    """
    properties = schema["properties"]
    column_config: ColumnConfigMap = {}
    for key, prop in properties.items():
        if (
            prop["type"] == ColumnDataKind.STRING
            and prop.get("format") == "date-time"  # marks column as datetime
        ):
            column_config[key] = st.column_config.DatetimeColumn(
                format="YYYY-MM-DD HH:mm",
            )
        elif prop["type"] == ColumnDataKind.STRING:
            column_config[key] = st.column_config.TextColumn(max_chars=prop.get("maxLength", None))
        elif prop["type"] == ColumnDataKind.BOOLEAN:
            column_config[key] = st.column_config.CheckboxColumn()
        elif prop["type"] == "object":
            column_config[key] = st.column_config.Column()
        elif prop.get("enum") and len(prop["enum"]) > 0:
            column_config[key] = st.column_config.SelectboxColumn(options=prop["enum"])
        elif prop["type"] == ColumnDataKind.INTEGER and prop.get("format", None) == "time":
            column_config[key] = st.column_config.NumberColumn()
        elif prop["type"] == ColumnDataKind.INTEGER:
            column_config[key] = st.column_config.NumberColumn(
                max_value=prop.get("max", None),
                min_value=prop.get("min", None),
                step=prop.get("multipleOf", None),
            )
        elif prop["type"] == "number":
            st.column_config.NumberColumn(
                max_value=prop.get("max", None), min_value=prop.get("min", None)
            )
        # assign common properties for every column
        try:
            column: ColumnConfig = column_config[key]
            column["label"] = prop.get("title", "")
            column["help"] = "format: " + prop.get("format", column["type_config"]["type"])
            column["disabled"] = prop.get("readOnly", False)
            column["required"] = key in schema.get("required", [])  # noqa: E501
        except Exception as e:
            print(f"An error occurred: {str(e)}")

    return column_config


def rxdb_dataframe(
    collection_config,
    db_config: RxCollectionCreator = DEFAULT_DB_CONFIG,
    query: Optional[Dict[str, Any]] = None,
    with_rev: Optional[bool] = False,
    on_change: Optional[Callable] = None,
) -> pd.DataFrame:
    state = RxDBSessionState()
    if state.dataframe is None:
        state.dataframe = get_dataframe_by_schema(collection_config["schema"])
    if state.column_config is None:
        state.column_config = get_column_config(collection_config["schema"])

    result = _rxdb_dataframe(
        collection_config=collection_config,
        db_config=db_config,
        query=query,
        with_rev=with_rev,
        key=(RXDB_COLLECTION_KEY),
        editing_state=ss[RXDB_COLLECTION_EDITOR_KEY],
    )

    try:
        if result and result["docs"]:
            result_df = pd.DataFrame(result["docs"], columns=state.dataframe.columns)
            state.docs = result["docs"]
            state.info = result["info"]
            state.query = result["query"]  # store query here from response, to prevent re-rendering
            state.dataframe = result_df
            on_change(state)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

    return state.dataframe


__title__ = "RxDB Dataframe"
__desc__ = "Make Dataframe from [RxDB](https://rxdb.info/) collection"
__icon__ = "🏦"
# __examples__ = [example]
__author__ = "voznik"
__streamlit_cloud_url__ = "https://st-rxdb-dataframe.streamlitapp.com/"
__github_repo__ = "voznik/ngx-odm"
