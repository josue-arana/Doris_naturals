//Contentful access
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "qnnm8ta2odbf",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "mxmc_n_uPUFmuyrW_xD8NVlfADZG6H6yB7bM2CvnU60",
});

//variables

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");

const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");

const productsDOM = document.querySelector(".products-center");

// main cart list
let cart = [];
// buttons
let buttonsDOM = [];
let total = 0;

// getting the products
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "dorisNaturals",
      });
      //   console.log(contentful);

      let result = await fetch("./products.json");
      let data = await result.json();

      let products = contentful.items;

      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display products
class UI {
  displayProducts(products) {
    // console.log(products);
    let result = "";
    products.forEach((product) => {
      result += `
        <!-- single product -->
            <article class="product" >
                <div class="img-container">
                    <img
                        src=${product.image}
                        alt="product"
                        class="product-img"
                    />
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>${product.price}</h4>
        </article >
        <!--end of single product-- >  
        `;
      productsDOM.innerHTML = result;
    });
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }

      button.addEventListener("click", (event) => {
        //change button label to In Cart
        event.target.innerText = "In Cart";
        event.target.disabled = true;

        //get product from products from local storage
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        //add product to the cart
        cart = [...cart, cartItem];

        //save the cart in local storage
        Storage.saveCart(cart);

        //set cart values
        this.setCartValues(cart);

        //display cart item
        this.addCartItem(cartItem);

        //show the cart
        this.showCart();

        //hide the cart
        // this.cartLogic();
        // this.hideCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    //add amount and price of items
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    //update values
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
    total = tempTotal;
    // console.log(cartTotal, cartItems);
    // console.log("set cart values");
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<img src=${item.image} alt="product">
                        <div>
                            <h4>${item.title}</h4>
                            <h5>$${item.price}</h5>
                            <span class="remove-item" data-id=${item.id}>
                                remove
                            </span>
                        </div>
                        <div>
                            <i class="fas fa-chevron-up" data-id=${item.id}></i>
                            <p class="item-amount">${item.amount}</p>
                            <i class="fas fa-chevron-down" data-id=${item.id}></i>
                        </div>`;
    cartContent.appendChild(div);
    // console.log(cartContent);
  }

  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  setupAPP() {
    //allows us to show more than one item in the cart and hide and show the cart
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    //event listeners
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }

  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  cartLogic() {
    //clear cart button
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //cart functionality - event bubbler
    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        // console.log("removing item", id);
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id); //remove from cart
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount += 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;

        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }

  clearCart() {
    // console.log("in clear");
    var cartItems = cart.map((item) => item.id); //create array with all ids we have in the car
    cartItems.forEach((id) => this.removeItem(id)); //remove each of the items with given id

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    //filter the cart
    cart = cart.filter((item) => item.id !== id);
    //set cart value
    this.setCartValues(cart);
    //save cart
    Storage.saveCart(cart);
    //access the button
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart`;
    // console.log("removed item");
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// local storage class
class Storage {
  //create static method to use it without instantiating the class, no instance
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let product = JSON.parse(localStorage.getItem("products"));
    return product.find((product) => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

// event listener to get things kicked up
document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();

  //setup app
  ui.setupAPP();
  ui.cartLogic();

  // get all products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
    });
});

// var checkout_url = "https://www.paypal.com/sdk/js?client-id=AYVUPu8o0f-Q3u4FdZ9SOjqRXJzcPZy4tm9dzI8AlqyIkX1my7HE_-AZdSkBLYQHmxlJYFj5RZD3w43E";
/* // Replace YOUR_SB_CLIENT_ID with your sandbox client ID */

/* Paypal Checkout */
paypal
  .Buttons({
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [
          {
            amount: {
              value: total,
            },
          },
        ],
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        alert("Transaction completed by " + details.payer.name.given_name);
      });
    },
  })
  .render("#paypal-button-container");
/* // Display payment options on your web page */

$("#shop").click(function () {
  $("html,body").animate(
    {
      scrollTop: $("#products")[0].scrollHeight - 100,
    },
    "slow"
  );
});
