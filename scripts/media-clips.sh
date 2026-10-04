# Clip table shared by encode-media.sh and contact-sheets.sh. Sourced, not run.
#
#   id | source file | start (s) | duration (s) | poster (s) | width | crf h264 | crf vp9 | wrap
#
# All times are seconds in the SOURCE file, the same timestamps printed on the
# contact sheets in docs/contact-sheets/. Empty duration = to the end of the
# source. Empty poster = the clip's first frame (= start). wrap=1: the source
# loops, so the clip can start mid-way and run on past the end into the
# beginning (Breadcrumb's source is only 7.8 s: start 5 s, 7.8 s long).

CLIPS=(
  "google-play|google.gif|0|9||480|25|34"
  "lily|lily.gif|0|||720|23|32"
  "breadcrumb|breadcrumb.gif|5|7.8|5|720|23|32|1"
  "look-closer|look-closer.gif|0|||720|24|33"
  "little-helper|little-helpers.gif|0|||720|24|33"
  "desol|desol.gif|0|||720|24|33"
)
