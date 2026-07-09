#!/bin/bash

readme=`cat<<EOF
This is a tool for automatically spectate in Dota2. As the game updated to Source2, some command under console are not worked at all. So it is necessary to use a xdotool script.
Please set proper coordinate as your resolution for your mouse.
EOF`

echo $readme
 
WID=`xdotool search --name "dota"`
xdotool windowactivate --sync $WID

while : 
do
	xdotool mousemove -w $WID 1050 325
	xdotool click 1
	# To skip any error raised by game
	xdotool key Escape
	sleep 360s
done
