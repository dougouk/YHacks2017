import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import re
import glob
import logging
import os
# import cloudstorage as gcs
# import webapp2

from subprocess import check_output
from flask import Flask

app = Flask(__name__)



@app.route('/')
def hello():
    return 'Hello World!'

@app.route('/trends')
def getTrends():
    print 'analyzing...'
    data = analyzeData()
    plot_by_feature(data, "balance")
    print 'done plotting'
    return 'trends'

@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500

# the magic function
def sb_BarPlot(data, label,measure):
    a4_dims = (15.0, 10.27)
    fig, ax = plt.subplots(figsize=a4_dims)
    plot = sns.barplot(y=label, x=measure,ax=ax, data=data,orient="horizontal")
    plot.figure.savefig("output.png");

# feature name http endpoint
# TODO create endpoint
def plot_by_feature(data, feature_name):
    sb_BarPlot(data,"category_name",feature_name)

# category
# return dataframe... using pandas dataframe.balance
# top 5 projects of a category
# TODO Create endpoint
def list_top_projects_by_category(data, category_name):
    data.loc[data.category_name == category_name].head()


# heat map
def get_correlation_of_features(data):
    a4_dims = (20.0, 14.27)
    corr = data.corr()
    fig, ax = plt.subplots(figsize=a4_dims)
    plot = sns.heatmap(corr,annot=True)
    plot.figure.savefig("correlation.png")

# Call this each time you get an endpoint
# TODO cache results
def analyzeData():

    # get the dir of data
    dir = 'data/'
    print(check_output(["ls", dir]).decode("utf8"))
    #convert data into dataframe
    data = pd.DataFrame()
    print 'converted data into dataframe'

    # for each file, access the data, and read them
    # concatenate into one dataframe
    # cache it
    for f in glob.glob((dir + '*.csv')): # all files in the directory that matchs the criteria.
        data = pd.concat([data,pd.read_csv(f)])

    #remove the useless columns
    useless_columns = ["id","url","category_url","igg_image_url","compressed_image_url","card_type",
                       "category_slug","source_url","friend_team_members","friend_contributors"]
    data = data.drop(useless_columns, axis = 1)

    # clean
    # set each param to variable
    data.balance = data.balance.apply(lambda row : Remove_Non_Numeric(row) )
    data.collected_percentage = data.collected_percentage.apply(lambda row : Remove_Non_Numeric(row) )
    data.amt_time_left = data.amt_time_left.apply(lambda row: Get_Days_Left(row))
    data.in_forever_funding = data.in_forever_funding.apply(lambda row: Clean_Funding(str(row)))
    data.balance = data.balance.apply(lambda row: float(row))

    return data

# if there are strings, remove them. NOT the column. Just the string part from numeric
def Remove_Non_Numeric(column):
    return re.sub(r"\D", "", column)

# clean data
def Get_Days_Left(time):
    if  "hour" in time:
        return float(Remove_Non_Numeric(time))/24
    elif "day" in time:
        return float(Remove_Non_Numeric(time))
    else:
        return 0.0

# clean data
def Clean_Funding(column):
    if  "true" in column.lower():
        return 1
    elif "false" in column.lower() :
        return -1
    else:
        return 0

if __name__ == '__main__':
    app.debug = True
    app.run()
    app.run(debug = True)
