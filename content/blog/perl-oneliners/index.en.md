+++
title = "Perl oneliners for Bioinformatics"
date = 2017-02-09
description = "Here I place some Perl-oneliners (may be not common used) by me. You can use them to modify, count , summarize or change file type on plain-text (like fastx)."
draft = false
aliases = ["/blog/perl-oneliners/"]

[taxonomies]
tags = ["Perl"]

[extra]
source = "my_website"
toc = true
+++
To use most of one-liners in this post, you should:

1. If you're working on *Windows*, download and install [ActiveState Perl](https://www.activestate.com/platform/supported-languages/perl/).
2. Replace variable `$file` at the end of scripts by the real file name.
3. Run the script as a command in `CMD`.

- [Extract a reference sequence from a single-query *FASTA* file](#extract-a-reference-sequence-from-a-single-query-fasta-file)
- [Find plain-text files with same appendix in multiple directories recursively and merge them into one file](#find-plain-text-files-with-same-appendix-in-multiple-directories-recursively-and-merge-them-into-one-file)
- [Filter *FASTQ* by length of query](#filter-fastq-by-length-of-query)
- [To "flare out" *FASTA* queries](#to-flare-out-fasta-queries)
- [To calculate the proportion of gaps ("N" or "n") in a genome](#to-calculate-the-proportion-of-gaps-n-or-n-in-a-genome)
- [To get reads in *FASTQ* with specific length and count in descending order](#to-get-reads-in-fastq-with-specific-length-and-count-in-descending-order)
- [To calculate positive and negtive read counts separately](#to-calculate-positive-and-negtive-read-counts-separately)
- [To print file names in current directory](#to-print-file-names-in-current-directory)
- [To remove all patches and scaffolds etc., but leave only chromosomes in a genome reference file.](#to-remove-all-patches-and-scaffolds-etc-but-leave-only-chromosomes-in-a-genome-reference-file)
- [To convert *FASTQ* into *FASTA*](#to-convert-fastq-into-fasta)

## Extract a reference sequence from a single-query *FASTA* file

Replace the scalar $start and $end with two number indicating location then execute.

```perl
perl -ne 'next if /^>/; $_ =~ s/[\r\n]+//g; @a = split //, $_; for (@a) {$i ++; if(($i >= $start) && ($i <= $end)) {print}}' $file
```

## Find plain-text files with same appendix in multiple directories recursively and merge them into one file

Replace the scalar $append with the suffix (e.g. .seq) then execute.

```perl
perl -MFile::Find -le "sub search{if (/\$append$/){($id) = map{/.+_(\(.+).seq$/} $_; open(SEQ, qq{<}, $File::Find::name) or die qq{Processing:$File::Find::name\n$!\n}; while(<SEQ>) {print MERGE qq{>$id}; print MERGE $_} }} open MERGE, qq{>}, qq{sanger.fa}; find({ wanted => \&search, no_chdir => 1 }, qq{.})" $file
```

## Filter *FASTQ* by length of query

Replace the scalar $minlen and $maxlen with the number representing interval then execute.

```perl
perl -lane "if ($. % 4 == 1) {$id = $_ =~ s/[\r\n]+//r} elsif ($. % 4 == 2) {$seq = $_ =~ s/[\r\n]+//r} elsif ($. % 4 == 3) {$name = $_ =~ s/[\r\n]+//r} else {$qual = $_ =~ s/[\r\n]+//r; print qq{$id\n$seq\n$name\n$qual} if ((length($seq) >= $minlen) && (length($seq) <= $maxlen))}" $file
```

## To "flare out" *FASTA* queries

*FASTA* is a file format and is recommended that all lines of text be shorter than 80 characters.
However, when we need to grep continuous strings in it, the line break such as `[\r\n]` usually cause troubles.
Use this command can remove newline characters in sequences.

```perl
perl -pe '$. == 1 ? 23333333 : /^>/ ? $_ = qq{\n} . $_ : s/[\r\n]+//' $file
```

## To calculate the proportion of gaps ("N" or "n") in a genome

```perl
perl -lne 'next if /^>/; $_ =~ s/[\r\n]+//; $total_len += length($_); $n_count += map{/[nN]/g} $_ }{ END{print qq{Total length: $total_len}; print qq{N count: $n_count}; $n_ratio = $n_count / $total_len; print qq{N ratio: $n_ratio}}' $file
```

## To get reads in *FASTQ* with specific length and count in descending order

Replace the scalar `$length` with the length you're interested in (without unit such as "bp") then execute.

```perl
perl -lne 'next unless (($. % 4 == 2)&&(length($_) == $length)); $count{$_}++; }{ for (sort {$count{$b} <=> $count{$a}} keys %count) {print qq{$_\t$count{$_}}}' $file
```

## To calculate positive and negtive read counts separately

```perl
perl -lane 'next if /^@/; next if $F[1]&0x4; $len = eval join q{+}, map {/(\d+)[MID]/g} $F[5]; $pos{$len} ++ if $F[1] == 0; $neg{$len} ++ if $F[1] == 16 }{ print qq{$_\t$pos{$_}} for (keys %pos); print qq{$_\t-$neg{$_}} for (keys %neg)' $file
```

## To print file names in current directory

```perl
perl -le "print for (glob qq{*})"
```

## To remove all patches and scaffolds etc., but leave only chromosomes in a genome reference file.

```perl
perl -lpe '/^>/ && !/REF$/ ? last : /^>/ ? $_ =~ s/>(\w+)/>chr$1/ : 23333333' $file
```

## To convert *FASTQ* into *FASTA*

```perl
perl -F'@' -lanE'$. % 4 == 1 ? say qq{>$F[1]} : $. % 4 == 2 ? say $_ : $. % 4 == 3 ? qq{Yu Sun is handsome} : 233333333' $file
```
