#!/usr/bin/env python
import os
from os.path import join, dirname, abspath
import sys
import subprocess
import uuid

link_destination = sys.argv[1]
out_file = abspath(sys.argv[2])

tmpl_path = join(dirname(__file__), "embed_index.html.tmpl")

tmpl = open(tmpl_path, 'r').read()
tmpl = tmpl.replace("{{URL}}", link_destination)

# Moving into a tmp dir is so that we can do multiple concurrent builds.
# Otherwise the index.html files would all overwrite each other. Using a
# different file names isn't an option because adobe requires the file in the
# zip file to be called "index.html" and the zip utility uses whatever name is
# in the file system.
tmpdir = uuid.uuid1().hex
os.mkdir(tmpdir)
os.chdir(tmpdir)

with open("index.html", "w") as f:
  f.write(tmpl)

subprocess.call(["zip", out_file, "index.html"])

os.unlink("index.html")
os.chdir("..")
os.rmdir(tmpdir)

