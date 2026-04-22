import os
import re

def update_product_files():
    html_dir = "productos"
    
    # Files to process
    files = [
        "crema-facial.html",
        "vela.html",
        "gel-intimo.html",
        "shampoo.html",
        "desinfectante.html",
        "pomada.html"
    ]
    
    # 1. Update css attributes
    # From: <div class="store-links" style="display: flex; flex-direction: column; gap: 12px; max-width: 300px; text-align: left;">
    # To: <div class="store-links" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
    
    for filename in files:
        filepath = os.path.join(html_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = content.replace(
            '<div class="store-links" style="display: flex; flex-direction: column; gap: 12px; max-width: 300px; text-align: left;">',
            '<div class="store-links" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">'
        )
        # Also fix the bottom ones that had a slightly different style 
        # <div class="product-buy-options" style="margin-top: 24px; margin-inline: auto; max-width: 300px;">
        # <div class="store-links" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
        
        content = content.replace(
            '<div class="store-links" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">',
            '<div class="store-links" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">'
        )

        content = content.replace(
            '<div class="product-buy-options" style="margin-top: 24px; margin-inline: auto; max-width: 300px;">',
            '<div class="product-buy-options" style="margin-top: 24px; margin-inline: auto; max-width: 500px;">'
        )

        content = content.replace(
            '<div class="product-buy-options" style="margin-top: 32px;">',
            '<div class="product-buy-options" style="margin-top: 32px; display: flex; flex-direction: column; align-items: center;">'
        )

        # Remove arrow
        content = content.replace('<span class="store-arrow">→</span>', '')

        # Add style to store-card
        # <a href="..." target="_blank" rel="noopener" class="store-card">
        content = content.replace(
            'class="store-card">',
            'class="store-card" style="background: var(--card-bg); padding: 10px 16px; justify-content: center; flex: 1; min-width: 140px; box-shadow: none;">'
        )

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    print("Updated easy files.")

update_product_files()
