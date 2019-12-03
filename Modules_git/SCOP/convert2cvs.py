import sys
import csv
import os

writer = None  
infile = sys.argv[1]
mod = sys.argv[2]
des = sys.argv[3]

writer = csv.writer(open(infile + ".csv","w"))
# reader = csv.reader(open(mod))

dict_spfam = {}
dict_spfam2scop = {}
for rows in open(mod):
    row = rows.replace('\n', '').split('\t')
    if (len(row) < 5):
        continue
    dict_spfam[row[0]] = row[4]
    dict_spfam2scop[row[0]] = row[1]

dict_fam = {}
for rows in open(des):
    row = rows.replace('\n', '').split('\t')
    if (len(row) < 5):
        continue
    dict_fam[row[0]] = row[4]

seq_id = []
supfam_id =[]
match_region =[]
evalue = []
model_match_position = []
align_model = []
fam_evalue = []
scop_fam_id = []
scop_domain_id = []

spfam_name = []
fam_name = []
close_stuct = []
for line in open(infile):
   
    line =line.replace("\n","")

    vals = line.split("\t")
    
    seq_id.append(vals[0])      
    supfam_id.append(vals[1])      
    match_region.append(vals[2])     
    evalue.append(vals[3])     
    model_match_position.append(vals[4])
    align_model.append(vals[5]) 
    fam_evalue.append(vals[6])  
    scop_fam_id.append(vals[7])
    scop_domain_id.append(vals[8])

writer.writerow(["seqID","spfamID","spfamName","scopspfamID","matchRegion", "evalue","modelMatch","alignModel","famEvalue","scopFamID","closeStruct","scopDomID","famName"])

for i in range(0, len(seq_id)):
    writer.writerow([seq_id[i], supfam_id[i], dict_spfam[supfam_id[i]], dict_spfam2scop[supfam_id[i]],match_region[i], evalue[i], model_match_position[i], align_model[i], fam_evalue[i],scop_fam_id[i],dict_fam[scop_fam_id[i]],scop_domain_id[i],dict_fam[scop_domain_id[i]]])