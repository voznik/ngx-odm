import pandas as pd
import pytest

from rxdb_dataframe import get_dataframe_by_schema


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


if __name__ == "__main__":
    pytest.main([__file__])
