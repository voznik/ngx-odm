import os

import pandas as pd

import streamlit.components.v1 as components

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = False

if not _RELEASE:
    _rxdb_dataframe = components.declare_component(
        "rxdb_dataframe",
        url="http://localhost:4201",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _rxdb_dataframe = components.declare_component("rxdb_dataframe", path=build_dir)


def rxdb_dataframe(data, key=None):
    return _rxdb_dataframe(data=data, key=key, default=pd.DataFrame())
