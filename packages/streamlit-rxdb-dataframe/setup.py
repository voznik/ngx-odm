import setuptools

setuptools.setup(
    name="streamlit-rxdb-dataframe",
    version="0.0.1",
    author="voznik",
    author_email="",
    author_url="github.com/voznik",
    description="Custom DataFrame connecting RxDB collection",
    long_description="Custom DataFrame connecting RxDB collection",
    long_description_content_type="text/plain",
    url="",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.7",
    install_requires=[
        # By definition, a Custom Component depends on Streamlit.
        # If your component has other Python dependencies, list
        # them here.
        "streamlit >= 0.66",
    ],
    extras_require={
        "devel": [
            "wheel",
            "pytest==7.4.0",
            "playwright==1.39.0",
            "requests==2.32.0",
            "pytest-playwright-snapshot==1.0",
            "pytest-rerunfailures==12.0",
        ]
    }
)
