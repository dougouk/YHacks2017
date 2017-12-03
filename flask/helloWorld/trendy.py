import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import re
import glob

from subprocess import check_output
from flask import Flask

app = Flask(__name__)

# get the dir of data
dir = 'data/'

print(check_output(["ls", dir]).decode("utf8"))

#convert data into dataframe
data = pd.DataFrame()

# for each file, access the data, and read them
# concatenate into one dataframe
# cache it
for f in glob.glob((dir + '*.csv')): # all files in the directory that matchs the criteria.
    data = pd.concat([data,pd.read_csv(f)])

#remove the useless columns
useless_columns = ["id","url","category_url","igg_image_url","compressed_image_url","card_type",
                   "category_slug","source_url","friend_team_members","friend_contributors"]
data = data.drop(useless_columns, axis = 1)

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

# magic
def sb_BarPlot(data,label,measure):
    a4_dims = (15.0, 10.27)
    fig, ax = plt.subplots(figsize=a4_dims)
    plot = sns.barplot(y=label, x=measure,ax=ax, data=data,orient="horizontal")
    plot.figure.savefig("output.png");

# feature name http endpoint
def plot_by_feature(feature_name):
    sb_BarPlot(data,"category_name",feature_name)

# category
# return dataframe... using pandas dataframe.balance
# top 5 projects of a category
def list_top_projects_by_category(category_name):
    temp = data.loc[data.category_name == category_name].head().values
    for i in range(0, 3):
        print temp[i][0]
    # print temp


# heat map
def get_correlation_of_features():
    a4_dims = (20.0, 14.27)
    corr = data.corr()
    fig, ax = plt.subplots(figsize=a4_dims)
    plot = sns.heatmap(corr,annot=True)
    plot.figure.savefig("correlation.png")


# clean
# set each param to variable
data.balance = data.balance.apply(lambda row : Remove_Non_Numeric(row) )
data.collected_percentage = data.collected_percentage.apply(lambda row : Remove_Non_Numeric(row) )
data.amt_time_left = data.amt_time_left.apply(lambda row: Get_Days_Left(row))
data.in_forever_funding = data.in_forever_funding.apply(lambda row: Clean_Funding(str(row)))
data.balance = data.balance.apply(lambda row: float(row))

# get_correlation_of_features()
list_top_projects_by_category("Travel & Outdoors")
#
# plot_by_feature("nearest_five_percent")
