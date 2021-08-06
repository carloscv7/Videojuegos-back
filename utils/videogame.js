exports.cleanVideogames = (videogames) =>{
    if(Array.isArray(videogames)){
        return videogames.map(v => {
            const {_doc: {_owner, ...cleanedVideogame}} = v;
            return cleanedVideogame;
        })
    }else{
        const {_doc: {_owner, ...cleanedVideogame}} = videogames;
        return cleanedVideogame;
    }
    
}

exports.filterVideogames = (videogames, owner) => {
    return videogames.filter(v =>{
        return owner.toString() == v._owner.toString();
    });
}