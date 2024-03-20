import pandas as pd
from rxdb_dataframe import get_column_config, get_dataframe_by_schema


def test_get_column_config():
    schema = {
        "properties": {
            "name": {"type": "string", "maxLength": 50},
            "age": {"type": "integer", "min": 0, "max": 100},
            "is_active": {"type": "boolean"},
            "gender": {"type": "string", "enum": ["Male", "Female", "Other"]},
            "birth_date": {"type": "string", "format": "date-time"},
        },
        "required": ["name", "age"],
    }

    column_config = get_column_config(schema)

    assert "name" in column_config
    assert column_config["name"]["type_config"]["type"] == "text"
    assert column_config["name"]["type_config"]["max_chars"] == 50

    assert "age" in column_config
    assert column_config["age"]["type_config"]["type"] == "number"
    assert column_config["age"]["type_config"]["min_value"] == 0
    assert column_config["age"]["type_config"]["max_value"] == 100

    assert "is_active" in column_config
    assert column_config["is_active"]["type_config"]["type"] == "checkbox"

    assert "gender" in column_config
    assert column_config["gender"]["type_config"]["type"] == "selectbox"
    assert column_config["gender"]["type_config"]["options"] == ["Male", "Female", "Other"]

    assert "birth_date" in column_config
    assert column_config["birth_date"]["type_config"]["type"] == "datetime"
    assert column_config["birth_date"]["type_config"]["format"] == "YYYY-MM-DD HH:mm"


def test_get_dataframe_by_schema():
    # Test case 1: Empty schema
    schema = {}
    expected_df = pd.DataFrame()
    assert get_dataframe_by_schema(schema).equals(expected_df)

    # Test case 2: Schema with string properties
    schema = {
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "string"},
            "city": {"type": "string"},
        }
    }
    expected_df = pd.DataFrame(
        {
            "name": pd.Series(dtype="object"),
            "age": pd.Series(dtype="object"),
            "city": pd.Series(dtype="object"),
        }
    )
    assert get_dataframe_by_schema(schema).equals(expected_df)

    # Test case 3: Schema with boolean properties
    schema = {
        "properties": {"is_active": {"type": "boolean"}, "has_permission": {"type": "boolean"}}
    }
    expected_df = pd.DataFrame(
        {"is_active": pd.Series(dtype="bool"), "has_permission": pd.Series(dtype="bool")}
    )
    assert get_dataframe_by_schema(schema).equals(expected_df)
