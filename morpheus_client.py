import requests
import streamlit as st
import os
import json
from pathlib import Path

from utils.sbom_tools import parse_sbom
from callback.http_callback import HttpCallback
from utils.output_tools import generate_markdown
from utils.input_tools import build_input, print_input_data, product_dropdowns

st.set_page_config(page_title='Morpheus Client', layout='wide')

data_dir = os.getenv("DATA_DIR", '/data')
if not os.path.isdir(data_dir):
    raise ValueError('Missing required output dir: ' + data_dir)

if 'callback' not in st.session_state:
    st.session_state.callback = {}

def get_output_path() -> Path:
    return Path(data_dir, 'output.json')

def on_receive_callback(data):
    st.session_state['morpheus_waiting'] = False
    output_path = get_output_path()
    # If file exists from previous invocation, must delete it so new json output file will be saved correctly.
    if os.path.exists(output_path):
        os.remove(output_path)
    with open(output_path, 'w') as f:
        json.dump(data, f)


def print_output():
    callback_file = get_output_path()
    if callback_file.is_file():
        with open(callback_file, 'r') as f:
            st.header('Evaluation result')
            data = json.load(f)
            items = generate_markdown(data['output'])
            for item in items:
                with st.expander(item[0], expanded=True):
                    st.markdown(item[1])
            image = data['input']['image']['name'].split('/')[-1]
            tag = data['input']['image']['tag']
            product_ref = data['input']['scan']['product_ref']
            file_name = f"{image}:{tag}-{product_ref}.json"
            st.download_button(label='Download', type='primary', data=json.dumps(data), file_name=file_name)


callback_server = HttpCallback()

if not hasattr(st, 'callback_server_listening'):
    st.callback_server_listening = True
    if __name__ == '__main__':
        callback_server.serve(on_receive=on_receive_callback)

MORPHEUS_URL = os.getenv("MORPHEUS_URL")
if MORPHEUS_URL is None:
    raise ValueError('Missing required enviroment variable MORPHEUS_URL')

st.title("Agent Morpheus client")


def set_data_ready():
    st.session_state['data_ready'] = 'sbom' in st.session_state and 'cves' in st.session_state


def is_running():
    git_loading = False
    morpheus_waiting = False
    if 'git_loading' in st.session_state:
        git_loading = st.session_state['git_loading']
    if 'morpheus_waiting' in st.session_state:
        morpheus_waiting = st.session_state['morpheus_waiting']
    return git_loading or morpheus_waiting


if 'running' not in st.session_state:
    st.session_state['running'] = False

st.session_state['running'] = is_running()

if 'data_ready' not in st.session_state:
    st.session_state['data_ready'] = False


def update_file():
    if 'input_file' in st.session_state:
        file = st.session_state.input_file
        if file is not None:
            st.session_state['git_loading'] = True
            data = json.loads(file.getvalue())
            try:
                sbom = parse_sbom(data)
                st.session_state.sbom = sbom
                st.session_state['git_loading'] = False
                set_data_ready()
            except Exception as exc:
                main_col.error(repr(exc))


def send_to_morpheus():
    data = build_input()

    response = requests.post(MORPHEUS_URL, data=data.model_dump_json(by_alias=True).encode('utf-8'))
    if not response.ok:
        st.session_state['running'] = False
        main_col.error(f'Morpheus backend error: {response.status_code} - {response.reason}')
    st.session_state['running'] = False


def save_file():
    if "sbom" in st.session_state:
        data = build_input()
        st.session_state['morpheus_waiting'] = False
        return data.model_dump_json(by_alias=True, indent=True)
    else:
        return ""


main_col, helper_col = st.columns([2, 5])
main_col.header("Build Morpheus Request")

st.session_state.cves = main_col.text_input(label='CVEs', placeholder='CVE-2024-27304, CVE-2024-2961, ...',
                                            value='CVE-2024-27304', on_change=set_data_ready)
st.session_state.input_file = main_col.file_uploader("Pick a CycloneDX SBOM File generated form Syft")
update_file()
st.session_state.input_format = main_col.selectbox(label='Input format', options=['JSON', 'CSV'], index=1)

product_dropdowns(main_col)

main_col.button('Send to Morpheus', on_click=send_to_morpheus, type='primary',
                disabled=is_running() or not st.session_state['data_ready'])
main_col.download_button('Save Morpheus Input', type='secondary', file_name='input.json',
                         disabled=not st.session_state['data_ready'], data=save_file())

print_input_data(helper_col)

print_output()
