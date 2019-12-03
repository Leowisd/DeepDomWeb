#!/usr/bin/perl -w
# superfamily.pl
# http://supfam.org
# Copyright (c) 2001 MRC and Julian Gough; see http://supfam.org/SUPERFAMILY/license.html
# David Morais 28.09.10
# Modified by Yifu Yao 11/25/2019

use strict;

my $usage="USAGE:\nsuperfamily.pl <genome.fa>\n\noptionally\nnohup superfamily.pl <genome.fa> & \n";

unless (@ARGV==1)
{
print $usage;	
	
}   
$ARGV[0]=~/^(\w+)\.fa$/;
my @var= split("/", $ARGV[0]);
my $tmp = $var[$#var];
my @var2 = split(/\./, $tmp);
my $file = $var2[0];

print "Running fasta checker\n";
system "perl Modules/SCOP/fasta_checker.pl $ARGV[0] >data/tmp/$file\_torun.fa";


print "Running hmmscan\n";
system "perl Modules/SCOP/hmmscan.pl -o data/tmp/$file.res -E 10 -Z 15438 Modules/SCOP/hmmlib data/tmp/$file\_torun.fa --hmmscan hmmscan --threads 4 --tempdir data/tmp/ ";


print "Running assingments\n";
system "perl Modules/SCOP/ass3.pl -t n -f 4 -e 0.01 data/tmp/$file\_torun.fa data/tmp/$file.res data/tmp/$file.ass ";


print "Running convert to cvs\n";
system "python Modules/SCOP/convert2cvs.py data/tmp/$file.ass Modules/SCOP/model.tab Modules/SCOP/dir.des.scop.txt";


# print "Running ass_to_html\n";
# system "perl Modules/SCOP/ass_to_html.pl Modules/SCOP/dir.des.scop.txt Modules/SCOP/model.tab data/tmp/$file.ass >data/SCOP/$file.html";

