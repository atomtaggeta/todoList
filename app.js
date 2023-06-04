//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-atom:test123@cluster0.z1gxa6d.mongodb.net/todolistDB")


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Coffee"
})

const item2 = new Item({
  name: "Cook"
})

const item3 = new Item({
  name: "Study"
})


const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {

  const foundItems = await Item.find({})
  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
  }
  res.render("list", {
    listTitle: "Today",
    newListItems: foundItems,
  });

});


app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({
    name: customListName
  });

  if (!foundList) {
    //Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems
    })
    await list.save();
    res.redirect("/" + customListName);
  } else {
    //Show an existing list
    res.render("list", {
      listTitle: customListName,
      newListItems: foundList.items
    })
  }
})

app.post("/", async function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/")
  } else {
    const currentPageItems = await List.findOne({
      name: listName
    });
    if (currentPageItems) {
      const currentItems = currentPageItems.items
      currentItems.push(item);
      currentPageItems.save();
      res.redirect("/" + listName)
    }
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    const deleteFromHome = await Item.findOneAndDelete({
      _id: checkedItemId
    });
    if (deleteFromHome) {
      res.redirect("/")
    }
  } else {
    const deleteSpecifics = await List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    });
    if (deleteSpecifics) {
      res.redirect("/" + listName)
    }
  }
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});