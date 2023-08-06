const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Note = require("../models/Note");

const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find().lean()
        if (!notes?.length) {
            return res.status(400).json({ message: "No Note Found" })
        }
        const notesWithUsers = await Promise.all(notes.map(async (note) => {
            const user = await User.findById(note.user).lean().exec()
            // console.log(note)
            return { ...note, username: user.username }
        }))
        res.json(notesWithUsers)
    }
    catch (err) {
        console.log(err)
    }
}

const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body
    //All data is present
    if (!user || !title || !text) {
        return res.status(400).json({ message: "All fields are required" })
    }
    //Duplicate Title
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: "title already exists" })
    }
    //Create a new note
    const createdNote = await Note.create({
        user,
        title,
        text
    })
    if (createdNote) { // Created 
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }
}

)

const updateNote = asyncHandler(async (req, res) => {
    const { id, title, text, user, completed } = req.body
    //All data is present
    if (!id || !title || !text || !user || typeof completed !== 'boolean') {
        return res.status(400).json({ message: "All fields are required" })
    }
    // Confirm note exists to update
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }
    //duplicate title check
    // Allow renaming of the original note 
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }
    //updating the note
    note.title = title
    note.text = text
    note.user = user
    note.completed = completed
    const updatedNote = await note.save()

    res.json(`'${updatedNote.title}' updated`)


})
// 
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body
    //id is present
    if (!id) {
        return res.status(400).json({ message: "id is required" })
    }
    //whether a note of that id exists 
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(404).json({ message: "note not found" })
    }
    //delete the note
    const result = await note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json(reply)

})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote,
};