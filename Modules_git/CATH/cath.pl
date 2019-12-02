#!/usr/bin/perl -w
# cath.pl
# Yifu Yao 11/30/2019

use strict;

my $usage="USAGE:\ncath.pl <genome.fa>\n\noptionally\nnohup cath.pl <genome.fa> & \n";

unless (@ARGV==1)
{
print $usage;	
	
}   
$ARGV[0]=~/^(\w+)\.fa$/;
my @var= split("/", $ARGV[0]);
my $tmp = $var[$#var];
my @var2 = split(/\./, $tmp);
my $file = $var2[0];

print "Run hmmsearch on sequence file\n";
# system "perl Modules/SCOP/fasta_checker.pl $ARGV[0] >data/tmp/$file\_torun.fa";
system "hmmsearch -Z 10000000 --domE 0.001 --incdomE 0.001 -o data/tmp/$file.hmmsearch Modules/CATH/hmms/main.hmm $ARGV[0]";

print "Resolve any conflicting (overlapping) domain assignments\n";
system "./Modules/CATH/cath-resolve-hits --min-dc-hmm-coverage=80 --worst-permissible-bitscore 25 --output-hmmer-aln --input-format  hmmsearch_out data/tmp/$file.hmmsearch > data/tmp/$file.crh";

print "Assign CATH superfamilies to the output file\n";
system "python Modules/CATH/assign_cath_superfamilies.py data/tmp/$file.crh";