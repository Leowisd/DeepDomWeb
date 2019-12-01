import sys
import csv
import os

writer = None  
infile = sys.argv[1]
writer = csv.writer(open(infile + ".csv","w"))

seq_id = [];
supfam_id =[];
match_region =[];
evalue = [];
model_match_position = [];
align_model = [];
fam_evalue = [];
scop_fam_id = [];
scop_domain_id = [];
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

writer.writerow(["seq-id","spfam-id","match-region", "evalue","model-match","align-model","fam-evalue","scop-fam-id","scop-dom-id"])

for i in range(0, len(seq_id)):
    writer.writerow([seq_id[i], supfam_id[i], match_region[i], evalue[i], model_match_position[i], align_model[i], fam_evalue[i],scop_fam_id[i],scop_domain_id[i]])