# Clip table shared by encode-media.sh and contact-sheets.sh. Sourced, not run.
#
#   id | source file | start (s) | duration (s) | poster (s) | width | crf h264 | crf vp9
#
# All times are seconds in the SOURCE file, the same timestamps printed on the
# contact sheets in docs/contact-sheets/. Empty duration = to the end of the
# source. Empty poster = the clip's first frame (= start).
#
# little-helper and desolation-wanderer are no longer shown on the page
# (Games & XR is one line now); kept so their media can be regenerated.
CLIPS=(
  "google-play|google.gif|0|9||480|25|34"
  "lily|lily.gif|0|||720|23|32"
  "breadcrumb|breadcrumb.gif|0|||720|23|32"
  "look-closer|look-closer.gif|0|||720|24|33"
  "trustpath|trustPath.gif|0|||720|24|33"
  "little-helper|little-helpers.gif|0|||720|24|33"
  "desolation-wanderer|desol.gif|0|||720|24|33"
)
