# run server with http rest api and web socket and no running pumps
# on macos/linux - create virtual env
ource /Users/prashantsinha/dev/wastewater-opcua-simulation-platform/.venv/bin/activate
python server.py --with-api 

# run http client/dashboard
# npm install if not installed already
cd ui
npm run dev