const Citation = require('../models/Citation');
const User = require ('../models/User')
const CitationHumor = require('../models/CitationHumor')
const UserController = require('../controllers/userController');

class CitationController {
    // Retrieve all citations with pagination
    static async getAllCitations(req, res) {
        // Parse query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        try {
            // Count total number of citations
            const totalCitations = await Citation.countDocuments();
            // Calculate total number of pages
            const totalPages = Math.ceil(totalCitations / pageSize);

            // Retrieve paginated citations from the database
            const citations = await Citation.find()
                .sort({ creationDate: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize);

            // Simplify citation objects by extracting only necessary attributes
           const simplifiedCitations = citations.map(({ _id, title, description, numberLike, creationDate, writerName, likes, favs, humor }) => ({
                _id,
                title,
                description,
                numberLike,
                creationDate,
                writerName,
                likes,
                favs
            }));

            // Send paginated and simplified citations in the response
            res.status(200).json({
                totalPages,
                currentPage: page,
                pageSize,
                totalCitations,
                citations: simplifiedCitations,
            });
        } catch (err) {
            // Handle errors by sending a 500 Internal Server Error response
            res.status(500).json({ message: err.message });
        }
    }

    // Retrieve a specific citation by ID
    static async getCitationById(req, res, next) {
        let citation;
        try {
            // Attempt to find a citation by its ID
            citation = await Citation.findById(req.params.id);

            // If the citation is not found, return a 404 response
            if (citation == null) {
                return res.status(404).json({ message: 'Cannot find citation' });
            }
            res.status(200).json(citation);
        } catch (err) {
            // If an error occurs during the retrieval, return a 500 response
            return res.status(500).json({ message: err.message });
        }
    }


    // Retrieve a specific Humor by ID
    static async getHumorById(req, res, next) {
        let citation;
        try {
            // Attempt to find a citation by its ID
            const humor = await CitationHumor.findById(req.params.id);

            // If the citation is not found, return a 404 response
            if (humor == null) {
                return res.status(404).json({ message: 'Cannot find citation' });
            }
            res.status(200).json(humor);
        } catch (err) {
            // If an error occurs during the retrieval, return a 500 response
            return res.status(500).json({ message: err.message });
        }
    }

    // Create a new citation
    static async createCitation(req, res) {
        try {
            const citation = new Citation({
                title: req.body.title,
                description: req.body.description,
                humor: req.body.humor,
                writerId: req.client.id,
                writerName: req.client.name,
            });

            const newCitation = await citation.save();
            await UserController.addCreatedCitation(req, newCitation.id);
            res.status(201).json(newCitation);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    static async searchCitations(req, res) {
        try {
            const filter = req.query.filter;
            const value = req.query.value;

            let query = {};
            if (filter === 'title') {
                query.title = new RegExp(value, 'i');
            } else if (filter === 'author') {
                query.writerName = new RegExp(value, 'i');
            }

            // Recherche dans la base de données avec le filtre
            const citations = await Citation.find(query).sort({ creationDate: -1 })
            res.json(citations);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    static async getRandomCitations(req, res) {
        try {
            const count = req.body.count || 10 ; // Nombre de citations à récupérer
            const citations = await Citation.aggregate([{ $sample: { size: count } }]);
            res.json(citations);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }


    // Update an existing citation
    static async updateCitation(req, res) {
        try {

            const citation = await Citation.findById(req.params.id);

            // Check if the user trying to update the citation is the original author
            if (req.client.id !== citation.writerId.toString())
                return res.status(403).json({ message: 'Access forbidden.' });

            // Update citation properties if they are provided in the request body
            if (req.body.title != null) {
                citation.title = req.body.title;
            }
            if (req.body.description != null) {
                citation.description = req.body.description;
            }

            if(req.body.humor != null){
                citation.humor = req.body.humor
            }

            const updatedCitation = await citation.save();

            // Return the updated citation in the response
            res.status(201).json({
                data: updatedCitation,
                message: "The citation updated correctly"
            });
        } catch (err) {
            // If an error occurs during the update, return a 400 response with the error message
            res.status(400).json({ message: err.message });
        }
    }

    static async likeCitation(req, res) {
        try {
            const citation = await Citation.findById(req.params.id);
            if (citation.likes.includes(req.client.id)) {
                return res.status(400).json({
                    data:citation,
                    message: 'You have already liked this citation.' });
            }
            citation.likes.push({userId: req.client.id, userName: req.client.name});
            //citation.likes.push(req.client.id);
            citation.numberLike = citation.likes.length;
            await citation.save();
            await UserController.addLikedCitation(req, citation.id);
            res.send(citation);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    static async unLikeCitation(req, res) {
        const citation = await Citation.findById(req.params.id);
        //const index = citation.likes.indexOf(req.client.id);
        const index = citation.likes.findIndex(like => like.userId.equals(req.client.id));
        if (index > -1) {
            citation.likes.splice(index, 1);
            citation.numberLike = citation.likes.length;
            await citation.save();
            req.body.citationId = citation.id;
            UserController.removeLikedCitation(req)
                .then(() => res.send(citation))
                .catch((err) => res.status(500).send({ message: err }));
        } else {
            res.status(404).send({ message: 'Like not found for this citation' });
        }
    }

    static async favoriteCitation(req, res) {
        try {
            const citation = await Citation.findById(req.params.id);
            if (citation.favs.includes(req.client.id)) {
                return res.status(400).json({
                    data:citation,
                    message: 'You have already favorited this citation.' });
            }
            citation.favs.push({userId: req.client.id, userName: req.client.name});
            //citation.favs.push(req.client.id);
            await citation.save();
            await UserController.addFavoriteCitation(req, citation.id);
            res.send(citation);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    static async unFavoriteCitation(req, res) {
        const citation = await Citation.findById(req.params.id);
        //const index = citation.favs.indexOf(req.client.id);
        const index = citation.favs.findIndex(like => like.userId.equals(req.client.id));
        if (index > -1) {
            citation.favs.splice(index, 1);
            await citation.save();
            req.body.citationId = citation.id;
            UserController.removeFavoriteCitation(req)
                .then(() => res.send(citation))
                .catch((err) => res.status(500).send({ message: err }));
        } else {
            res.status(404).send({ message: 'Favorite not found for this citation' });
        }
    }


    static async getAllCitationsHumor(req, res) {
        try {
            // Récupérer toutes les citations de la base de données
            const citations = await CitationHumor.find();

            // Retourner une réponse 200 avec les citations
            res.status(200).json(citations);
        } catch (err) {
            // Si une erreur se produit lors de la récupération, retourner une réponse 500 avec le message d'erreur
            res.status(500).json({ message: err.message });
        }
    }


    // Delete a citation
    static async deleteCitation(req, res) {
        const citationId = req.params.id;
        try {
            // Find the citation by its ID
            const citation = await Citation.findById(citationId);

            if (!citation) {
                return res.status(404).json({ message: 'Citation not found.' });
            }
            // Check if the user trying to delete the citation is the original author
            if (req.client.id !== citation.writerId.toString()) {
                return res.status(403).json({ message: 'Access forbidden.' });
            }

            const user = await User.findById(req.client.id);
            // Find the citation in the user's citations
            const citationIndex = user.allCitations.indexOf(citationId);
            if (citationIndex === -1) {
                return res.status(404).json({ message: 'Cannot find citation' });
            }

            // Remove the citation from the user's citations
            user.allCitations.splice(citationIndex, 1);

            // Save the user
            await user.save();


            // Remove the citation from the likes and favorites of all users
            await User.updateMany(
                { },
                { $pull: { allLiked: citation._id, allFavorite: citation._id } }
            );

            // Attempt to remove the citation from the database
            await Citation.findByIdAndDelete(citationId);

            // Return a 200 response indicating successful deletion
            res.status(200).json({ message: 'Deleted Citation' });
        } catch (err) {
            // If an error occurs during the deletion, return a 500 response with the error message
            res.status(500).json({ message: err.message });
        }
    }


}

module.exports = CitationController;
