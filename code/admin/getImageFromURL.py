import requests
from PIL import Image
import logging

def getImageFromURL(img_fromenvurl):
    
    try:
        # Send a HTTP request to the specified URL and save 
        # the response from server in a response object called r
        r = requests.get(img_fromenvurl)
        logging.info(f"Image_URL: {img_fromenvurl}")
        # Open the url image, set stream to True, this will return the stream content.
        r = requests.get(img_fromenvurl, stream=True)

        # Check if the image was retrieved successfully
        if r.status_code == 200:
            # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
            r.raw.decode_content = True
            
            # Open the image file
            actual_img = Image.open(r.raw)

            return actual_img
        else:
            logging.info(f"Failed to retrieve image. HTTP Status Code: {r.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        logging.info(f"An error occurred while making the request when retreiving the image from url: {e}")
        return None
    except Exception as e:
        logging.info(f"An unexpected error occurred when retreiving the image from url: {e}")
        return None



