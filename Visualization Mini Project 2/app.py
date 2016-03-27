from flask import Flask
from flask import render_template
from flask import request

import json
from bson import json_util
from bson.json_util import dumps

import random
import pandas as pd
import numpy as np
import scipy as ss
import nltk
import re

from collections import Counter

from nltk.stem.snowball import SnowballStemmer

from scipy.spatial.distance import cdist, pdist
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn import manifold

from sklearn.metrics.pairwise import cosine_similarity

from sklearn.metrics.pairwise import pairwise_distances

app = Flask(__name__)
stemmer = SnowballStemmer("english")
stopwords = nltk.corpus.stopwords.words("english")


@app.route("/skancharla")
def stats():
    return render_template("main.html")


# various Dimension Reduction Techniques
def process_dimred(random_sample_ds, dimred_type, mds_type):

	n_components = 2
	if dimred_type=="PCA":
	
		pca = PCA(n_components)
		result_ds = pca.fit_transform(random_sample_ds)
		
	elif dimred_type=="ISOMAP":

		n_neighbors = 10
		iso = manifold.Isomap(n_neighbors, n_components)
		result_ds = iso.fit_transform(random_sample_ds)

	elif dimred_type=="MDS":

		if mds_type=="Cosine":
			dist = cosine_similarity(random_sample_ds)
	 		mds = manifold.MDS(n_components, max_iter=100, n_init=1, dissimilarity='precomputed')
			result_ds = mds.fit_transform(dist)

		elif mds_type=="Euclidean":
			mds = manifold.MDS(n_components, max_iter=100, n_init=1, dissimilarity='euclidean')
			result_ds = mds.fit_transform(random_sample_ds)

		elif mds_type=="Correlation":
			dist = pairwise_distances(random_sample_ds,metric = 'correlation')
			mds = manifold.MDS(n_components, max_iter=100, n_init=1, dissimilarity='precomputed')
			result_ds = mds.fit_transform(dist)



	print result_ds
	return result_ds

# Random Sampling size = 1000
@app.route("/loans/Random",methods=['GET'])
def random_sampling():

	dimred_type = request.args.get("dimred")
	sample_size = 1000
	
	mds_type = ""
	if dimred_type=="MDS":
		mds_type = request.args.get("mdstype")


	print "in random sampling, dim red type = " +dimred_type + " mds type = "+mds_type

	dataset = pd.read_csv("./static/data/loans.csv")

	ddataset = dataset.replace([np.inf, -np.inf], np.nan)

	dataset = dataset.fillna(dataset.mean())

	random_sample_ds = dataset.sample(sample_size)
	result_ds = process_dimred(random_sample_ds, dimred_type, mds_type)

	
	json_array = []
	for x,y in result_ds:
		json_ob = {}
		json_ob['pc1'] = round(x,4)
		json_ob['pc2'] = round(y,4)
		json_array.append(json_ob)
	
	json_array = json.dumps(json_array, default=json_util.default)
	return json_array

#Adaptive Samping size = 1000, num of clusters = 5
@app.route("/loans/Adaptive",methods=['GET'])
def adaptive_sampling():
	
	dimred_type = request.args.get("dimred")

	mds_type = ""
	if dimred_type=="MDS":
		mds_type = request.args.get("mdstype")


	sample_size = 1000

	print "adaptive_sampling " + dimred_type + " mds -type = "+mds_type
	dataset = pd.read_csv("./static/data/loans.csv")

	dataset = dataset.replace([np.inf, -np.inf], np.nan)

	dataset = dataset.fillna(dataset.mean())

	num_clusters = 5

	km = KMeans(num_clusters)

	km.fit(dataset)
	dataset["label"] = km.labels_
	sample_ds = pd.DataFrame()
	
	for cluster_index in range(num_clusters):
		cluster = dataset[dataset["label"] == cluster_index]
		frac = int (sample_size*len(cluster)/len(dataset))
		cluster = cluster.sample(frac)
		sample_ds = sample_ds.append(cluster, ignore_index = True) 
	
	sample_ds = pd.DataFrame(sample_ds)
	result_ds = process_dimred(sample_ds, dimred_type, mds_type)

	result_ds = pd.DataFrame(result_ds)
	
	result_ds['cluster'] = sample_ds["label"]
	json_array = []
	for row in result_ds.iterrows():
		
		json_ob = {}
		json_ob['pc1'] = round(row[1][0],4)
		json_ob['pc2'] = round(row[1][1],4)
		json_ob['cluster'] = row[1][2]
		json_array.append(json_ob)
	
	json_array = json.dumps(json_array, default=json_util.default)
	#rs.to_csv("pca_rs.csv")
	return json_array

def tokenize_and_stem(text):
	tokens = [word for sent in nltk.sent_tokenize(text) for word in nltk.word_tokenize(sent)]
	filtered_tokens = []
	for token in tokens:
		if re.search('[a-zA-Z]', token):
			filtered_tokens.append(token)
	stems = [stemmer.stem(t) for t in filtered_tokens]
	return stems


def get_tf_idf_matrix(reviews):
	tfidf_vectorizer = TfidfVectorizer(max_df=0.8, max_features=200000,
                                     min_df=0.2, stop_words='english',
                                     use_idf=True, tokenizer=tokenize_and_stem, ngram_range=(1,3))
	tfidf_matrix = tfidf_vectorizer.fit_transform(reviews)
	return tfidf_matrix

@app.route("/word_clouds")
def text_clouds():

	df = pd.read_csv("./static/data/Reviews.csv")
	scores = df["Score"]
	summaries = df["Summary"]
	reviews = df["Text"]

	print " in text analytics app"
	stemmed_words = []
	tokenized_words = []
	for rev in reviews:
		try:
			tokens = [word.lower() for sent in nltk.sent_tokenize(rev) for word in nltk.word_tokenize(sent)]
			filtered_tokens = []
			for token in tokens:
				if re.search('[a-zA-Z]', token):
					if token not in stopwords:
						filtered_tokens.append(token)
			stems = [stemmer.stem(t) for t in filtered_tokens]
			stemmed_words.extend(stems)
			tokenized_words.extend(filtered_tokens)
		except Exception as e:
			continue

	json_array = []
	counts = Counter(tokenized_words)
	ms = counts.most_common(30)

	for tp in ms:
		json_ob = {}
		json_ob['text'] = tp[0]
		json_ob['size'] = tp[1]
		json_array.append(json_ob)

	json_array = json.dumps(json_array, default=json_util.default)
	print json_array
	return json_array


@app.route("/text_analytics")
def text_visualization():
	
	df = pd.read_csv("./static/data/Reviews.csv")
	scores = df["Score"]
	summaries = df["Summary"]
	reviews = df["Text"]

	print " in text analytics app"
	stemmed_words = []
	tokenized_words = []
	for rev in reviews:
		try:
			tokens = [word.lower() for sent in nltk.sent_tokenize(rev) for word in nltk.word_tokenize(sent)]
			filtered_tokens = []
			for token in tokens:
				if re.search('[a-zA-Z]', token):
					if token not in stopwords:
						filtered_tokens.append(token)
			stems = [stemmer.stem(t) for t in filtered_tokens]
			stemmed_words.extend(stems)
			tokenized_words.extend(filtered_tokens)
		except Exception as e:
			continue
	vocab_frame = pd.DataFrame({'words': tokenized_words}, index = stemmed_words)
	print 'there are ' + str(vocab_frame.shape[0]) + ' items in vocab_frame'
	tfidf_matrix = get_tf_idf_matrix(reviews)
	dist = 1 - cosine_similarity(tfidf_matrix)
	num_clusters = 5
	km = KMeans(n_clusters=num_clusters)
	km.fit(tfidf_matrix)
	clusters = km.labels_.tolist()
	svd = TruncatedSVD(n_components = 2)
	svdMatrix = svd.fit_transform(tfidf_matrix)
	print svdMatrix

	svdMatrix = pd.DataFrame(svdMatrix)
	svdMatrix["cluster"] = df["Score"]
	svdMatrix["label"] = df["Summary"]

	json_array = []
	for row in svdMatrix.iterrows():
		
		json_ob = {}
		json_ob['pc1'] = round(row[1][0],4)
		json_ob['pc2'] = round(row[1][1],4)
		json_ob['cluster'] = row[1][2]
		json_ob['label'] = row[1][3]
		print json_ob['cluster']
		print json_ob['label']
		json_array.append(json_ob)
	
	json_array = json.dumps(json_array, default=json_util.default)

	return json_array

def elbowknee():
	dt_trans = pd.read_csv('./static/data/loans.csv')
	dt_trans = dt_trans.replace([np.inf, -np.inf], np.nan)
	dt_trans = dt_trans.dropna()
	dt_trans = pd.DataFrame(dt_trans)

	kIdx = 5
	K = range(1,50)
	KM = [KMeans(n_clusters=k).fit(dt_trans) for k in K]
	centroids = [k.cluster_centers_ for k in KM]

	D_k = [cdist(dt_trans, cent, 'euclidean') for cent in centroids]
	cIdx = [np.argmin(D,axis=1) for D in D_k]
	dist = [np.min(D,axis=1) for D in D_k]
	avgWithinSS = [sum(d)/dt_trans.shape[0] for d in dist]

	# Total with-in sum of square
	wcss = [sum(d**2) for d in dist]
	tss = sum(pdist(dt_trans)**2)/dt_trans.shape[0]
	bss = tss-wcss

	df= pd.DataFrame([K,avgWithinSS]).T
	df2 = pd.DataFrame([K, list(bss/tss*100)]).T
	
	df.columns = ['K', "Sum"]
	df2.columns = ['K', "Percentage"]
	df2.set_index(['K'])
	df.set_index(['K'])
	print " ksum "

	df.to_csv('./static/data/K_Sum.csv',",", index_label=True, index = False)
	df2.to_csv('./static/data/K_Percentage.csv',',',index_label = True, index = False)
    
if __name__ == "__main__":
	app.run(host='localhost',port=5000,debug=True)
	elbowknee()
