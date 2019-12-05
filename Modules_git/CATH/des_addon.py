import os
import csv
import re
import sys


infile = sys.argv[1]

# read the csv and insert a new column include description for each family
dict_des = {}
des = sys.argv[2]
for line in open(des):
    row = line.replace("\n", "").split(":",1)
    head = re.split("\\s+", row[0])
    dict_des[head[0]] = row[1]

writer = csv.writer(open(infile.split('.')[0] + '.csv', 'w'))

csvfile = open(infile, 'r')
reader = csv.reader(csvfile)

for item in reader:
    if (item[0][0] == '#'):
        writer.writerow(item + ['description'])
    else:
        if (len(item) > 10):
            item.pop()
        writer.writerow(item + [dict_des[item[1]]])